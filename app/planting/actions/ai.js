'use server';

import { generateText } from '@/lib/planting/ai';
import { generateSystemPrompt, generatePracticeSystemPrompt, generateDiverseParameters, getModeDescription, getShapeDescription, calculateTreeCount, generateSolvingSteps } from '@/lib/planting/practice';

export async function chatAction({ message, interactionState, chatHistory = [], isNewConversation = false }) {
  const systemPrompt = generateSystemPrompt(interactionState || {});
  const contents = [systemPrompt];
  if (!isNewConversation && Array.isArray(chatHistory)) {
    for (const msg of chatHistory) {
      const role = msg?.role === 'assistant' ? '助手' : '用户';
      contents.push(`${role}: ${msg?.content || ''}`);
    }
  }
  contents.push(`用户: ${message || ''}`);
  const prompt = contents.join('\n\n');
  const responseText = await generateText({ prompt });
  const updated_history = [...(Array.isArray(chatHistory) ? chatHistory : []), { role: 'user', content: message }, { role: 'assistant', content: responseText }];
  return { response: responseText, updated_history };
}

export async function practiceChatAction({ message, interactionState, chatHistory = [], isNewConversation = false }) {
  const systemPrompt = generatePracticeSystemPrompt(interactionState || {});
  const contents = [systemPrompt];
  if (!isNewConversation && Array.isArray(chatHistory)) {
    for (const msg of chatHistory) {
      const role = msg?.role === 'assistant' ? '助手' : '用户';
      contents.push(`${role}: ${msg?.content || ''}`);
    }
  }
  contents.push(`用户: ${message || ''}`);
  const prompt = contents.join('\n\n');
  const responseText = await generateText({ prompt });
  const updated_history = [...(Array.isArray(chatHistory) ? chatHistory : []), { role: 'user', content: message }, { role: 'assistant', content: responseText }];
  return { response: responseText, updated_history };
}

export async function generateQuestionAction({ questionNumber, difficultyLevel = 'basic' }) {
  const strategies = {
    1: { type: 'basic_line', difficulty: 'basic' },
    2: { type: 'basic_line_both', difficulty: 'basic' },
    3: { type: 'line_advanced', difficulty: 'medium' },
    4: { type: 'shape_problem', difficulty: 'medium' },
    5: { type: 'comprehensive', difficulty: 'advanced' }
  };
  const strategy = strategies[questionNumber] || strategies[1];
  const params = generateDiverseParameters(strategy.type, questionNumber);
  const prompt = `你是一个专门为小学五年级学生设计植树问题的AI助手。\n\n请生成第${questionNumber}道植树问题练习题：\n\n**题目类型**: ${strategy.type}\n**难度要求**: ${strategy.difficulty}\n**参数配置**:\n- 长度: ${params.length}米\n- 间距: ${params.interval}米\n- 种植模式: ${getModeDescription(params.mode)}\n- 图形模式: ${getShapeDescription(params.shape)}\n\n**题目要求**:\n1. 适合五年级学生的理解水平\n2. 语言生动有趣，可以加入生活场景\n3. 数值设置便于口算\n4. 问题描述清晰具体\n5. 体现数学思维训练\n\n请生成一道符合要求的练习题，只返回题目描述文字，不要包含答案。`;
  const text = await generateText({ prompt });
  const expected = params.shape === 'circle'
    ? Math.floor(params.length / params.interval)
    : (params.mode === 'both' ? Math.floor(params.length / params.interval) + 1
      : params.mode === 'none' ? Math.floor(params.length / params.interval) - 1
      : Math.floor(params.length / params.interval));
  return {
    question_id: `q${questionNumber}_${Date.now()}`,
    question_text: String(text || '').trim(),
    parameters: params,
    expected_answer: expected,
    difficulty: strategy.difficulty
  };
}

export async function checkAnswerAction({ parameters, userAnswer }) {
  const correct = calculateTreeCount(parameters.length, parameters.interval, parameters.mode, parameters.shape);
  const is_correct = Number(userAnswer) === correct;
  const prompt = `你是一个植树问题的批改助手。\n\n**题目参数**:\n- 长度: ${parameters.length}米\n- 间距: ${parameters.interval}米\n- 模式: ${parameters.mode}\n- 图形: ${parameters.shape}\n\n**学生答案**: ${userAnswer}\n**正确答案**: ${correct}\n\n请提供:\n1. 判断答案是否正确\n2. 详细的解题步骤\n3. 如果错误，指出可能的错误原因\n4. 鼓励性的反馈\n\n回答要温和、具体，适合五年级学生理解。只返回简洁的解释文字。`;
  const explanation = await generateText({ prompt });
  const solving_steps = generateSolvingSteps(parameters.length, parameters.interval, parameters.mode, parameters.shape);
  return { is_correct, correct_answer: correct, explanation: String(explanation || '').trim(), solving_steps };
}

export async function evaluateSessionAction({ answers = [], totalTime = 0 }) {
  const correct_count = Array.isArray(answers) ? answers.filter(a => a?.is_correct).length : 0;
  const total_questions = Array.isArray(answers) ? answers.length : 0;
  const prompt = `你是一个小学数学老师，请为五年级学生的植树问题练习进行评估。\n\n**练习结果**:\n- 正确答题数: ${correct_count}/${total_questions}\n- 总用时: ${Number(totalTime) || 0}秒\n\n请提供:\n1. 总体表现评价（优秀/良好/需要加强）\n2. 3-4条具体的学习建议\n\n要求:\n- 语言鼓励性、正面向上\n- 适合五年级学生阅读\n- 建议要具体可行\n\n只返回建议列表，每条建议一行。`;
  const text = await generateText({ prompt });
  const suggestions = String(text || '').split('\n').map(s => s.trim()).filter(Boolean);
  let performance = '需要加强';
  if (total_questions > 0) {
    const rate = correct_count / total_questions;
    if (rate >= 0.8) performance = '优秀';
    else if (rate >= 0.6) performance = '良好';
  }
  const minutes = Math.floor((Number(totalTime) || 0) / 60);
  const seconds = (Number(totalTime) || 0) % 60;
  const total_time_text = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
  return { correct_rate: `${correct_count}/${total_questions}`, total_time_text, performance, suggestions };
}


