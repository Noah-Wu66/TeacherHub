export const DASI_ZHENGKE_PRACTICE_BASES = [
  '奥运场馆',
  '中国考古博物馆',
  '亮马河国际风情水岸',
  '朝阳区文化创意产业园区',
] as const;

export type DasiZhengkeTopicId = 'tongyan-aoyun' | 'liangmahe-gongsheng' | 'wenming-hujian';

export type DasiZhengkeAudience = 'student' | 'teacher';

export type DasiZhengkeTopic = {
  id: DasiZhengkeTopicId;
  title: string; // 显示题目
  subtitle: string; // 卡片副标题
  heroDescription: string; // 大标题下简介（随专题变化）
  highlightBases: string[]; // 与题目更强关联的基地（仍会在页面总体呈现全部基地）
  studentPrompts: string[];
  teacherPrompts: string[];
  studentGuide: {
    goal: string;
    method: string;
    task: string;
  };
  teacherGuide: {
    goal: string;
    method: string;
    task: string;
  };
};

export const DASI_ZHENGKE_TOPICS: DasiZhengkeTopic[] = [
  {
    id: 'tongyan-aoyun',
    title: '童眼看奥运·一起向未来',
    subtitle: '走进奥运场馆：体育精神、团结协作、拼搏向上',
    heroDescription:
      '重点选取奥运场馆等实践教育基地，以“童眼看奥运·一起向未来”为题，围绕体育精神与团结协作，充分利用朝阳区“家门口的思政教育基地”和“大中小学实景课堂”等区域资源优势，在实景课堂中引导师生深入学习贯彻党的二十届四中全会精神。',
    highlightBases: ['奥运场馆'],
    studentPrompts: [
      '“一起向未来”是什么意思？它和奥运精神有什么关系？请用通俗的话解释。',
      '把“更快、更高、更强——更团结”拆成 3 个关键词：每个关键词给解释 + 一个生活例子。',
      '参观奥运场馆时，我应该重点观察什么？给我 6 个观察点（含为什么）。',
      '我看到一个细节：___。这说明了什么？请用“现象—原因—意义—我能做什么”帮我分析。',
    ],
    teacherPrompts: [
      '以“童眼看奥运·一起向未来”为题，设计一节实景课堂：目标、流程（导入-探究-展示-反思）、任务单、评价量规。',
      '围绕奥运场馆，生成一套分层提问链（事实—解释—价值—行动）。',
      '请提供可写进教案的“规范表述”（课堂小结 + 作业要求），并融入学习贯彻党的二十届四中全会精神。',
      '给出学生常见误区与纠正策略（如只写“好玩”不写“意义”）。',
    ],
    studentGuide: {
      goal:
        '用自己的话说清楚“奥运精神/团结协作/向未来”的意义，并能用校园与生活中的例子说明。',
      method:
        '先记录现场细节，再用“关键词—解释—例子—总结”把想法说完整，最后用几句话清晰讲明白。',
      task:
        '完成一份“童眼观察单”：我看到___；我想到___；我理解的“向未来”是___；我准备在校园里___。',
    },
    teacherGuide: {
      goal:
        '以“大思政课”建设为重要载体，依托家门口的思政教育基地，引导师生在真实情境中理解并表达学习贯彻党的二十届四中全会精神。',
      method:
        '用“情境问题→基地证据→概念建构→价值判断→行动方案”的路径组织课堂，设置分层提问与成果展示。',
      task:
        '形成可落地的“实景课堂”材料包：导学单、任务单、板书设计、分层作业与评价量规（含大中小学实景课堂衔接建议）。',
    },
  },
  {
    id: 'liangmahe-gongsheng',
    title: '亮马河畔话共生',
    subtitle: '走进亮马河国际风情水岸：生态文明、城市治理、共建共享',
    heroDescription:
      '重点选取亮马河国际风情水岸等实践教育基地，以“亮马河畔话共生”为题，围绕生态文明与城市治理，充分利用朝阳区“家门口的思政教育基地”和“大中小学实景课堂”等区域资源优势，在实景课堂中引导师生深入学习贯彻党的二十届四中全会精神。',
    highlightBases: ['亮马河国际风情水岸'],
    studentPrompts: [
      '什么是“共生”？请用亮马河的例子解释，并说说为什么要共生。',
      '亮马河能体现哪些“生态文明/城市治理”的要点？请列 3 点并各举 1 个例子。',
      '我在亮马河看到___，这和“共生”有什么关系？用“现象—原因—意义—行动”帮我想清楚。',
      '如果我要向同学讲清楚“亮马河畔话共生”，我该按什么顺序讲？给一个清晰讲解框架。',
    ],
    teacherPrompts: [
      '以“亮马河畔话共生”为题，设计家门口的思政教育基地实景课堂：情境问题、探究任务、跨学科融合点与安全提示。',
      '生成课堂讨论组织方案：分组任务、展示方式、教师追问与课堂纪律提醒。',
      '设计一份学生研学记录表（字段+示例）与分层评价标准（A/B/C）。',
      '请给出“共生”主题的板书结构与可直接使用的规范表述。',
    ],
    studentGuide: {
      goal:
        '能用自己的话解释“共生”，并能用亮马河的所见所闻说明“我理解—我行动”。',
      method:
        '围绕“人与自然/城市与河流/个人与公共空间”，用例子说明观点，再给出可执行的小行动。',
      task:
        '完成“共生小行动”：我发现的一个问题是___；我理解它与共生的关系是___；我能做到___；我愿意邀请同学一起___。',
    },
    teacherGuide: {
      goal:
        '利用“大中小学实景课堂”资源优势，将生态文明与城市治理融入思政学习，引导师生在真实场景中形成问题意识与行动意识。',
      method:
        '以“问题情境—证据观察—概念澄清—价值引导—行动设计”为主线，组织小组探究与课堂辩题的规范引导。',
      task:
        '产出“实景课堂”闭环：任务单→课堂展示→评价量规→校内延伸实践（班级公约/校园文明行动）。',
    },
  },
  {
    id: 'wenming-hujian',
    title: '文明互鉴在朝阳',
    subtitle: '走进中国考古博物馆与文创园：文明传承、交流互鉴、创新表达',
    heroDescription:
      '重点选取中国考古博物馆、朝阳区文化创意产业园区等实践教育基地，以“文明互鉴在朝阳”为题，围绕文明传承与交流互鉴，充分利用朝阳区“家门口的思政教育基地”和“大中小学实景课堂”等区域资源优势，在实景课堂中引导师生深入学习贯彻党的二十届四中全会精神。',
    highlightBases: ['中国考古博物馆', '朝阳区文化创意产业园区'],
    studentPrompts: [
      '“文明互鉴”是什么意思？请用一个文物或历史现象举例说明。',
      '在博物馆看文物时，怎样从“看见什么”推到“它说明什么”？给 4 步方法。',
      '文创园区里的创意产品，和传统文化传承有什么关系？请举 2 个例子解释。',
      '我会粘贴一段材料：请帮我提取关键词并解释，每个关键词给一个例子。',
    ],
    teacherPrompts: [
      '以“文明互鉴在朝阳”为题，结合中国考古博物馆与文化创意产业园区，设计项目化学习方案：目标、任务、成果、评价。',
      '给出可写进教案的规范表述与板书设计（含关键词解释与常见误区）。',
      '设计“学习成果展示”的 rubric（内容、表达、合作、行动）并给出等级描述。',
      '请提供一套分层提问链：从“看见什么”到“为什么重要”再到“我能做什么”。',
    ],
    studentGuide: {
      goal:
        '能说清“文明互鉴”的含义，用参观材料举例说明，并理解“传承与创新”的关系。',
      method:
        '从“一个文物/一个场景”说起，解释它代表的文明信息，再联系当代生活与创新表达。',
      task:
        '完成“文明互鉴小讲解”：我选择的一个展品/现象是___；它告诉我___；我理解的文明互鉴是___；我想用___方式把它分享给同学。',
    },
    teacherGuide: {
      goal:
        '依托区域资源，把文明传承与创新表达贯通起来，形成可迁移的学习任务链，并服务于学习贯彻党的二十届四中全会精神的育人目标。',
      method:
        '采用“证据-解释-价值-行动”结构，组织探究式与项目化学习；强调规范表述、证据意识与价值引导。',
      task:
        '输出一套“基地+课堂+作业+评价”一体化方案，并给出跨学段衔接的“大中小学实景课堂”建议。',
    },
  },
];

export const DEFAULT_DASI_ZHENGKE_TOPIC_ID: DasiZhengkeTopicId = 'tongyan-aoyun';

export function isDasiZhengkeTopicId(v: unknown): v is DasiZhengkeTopicId {
  return v === 'tongyan-aoyun' || v === 'liangmahe-gongsheng' || v === 'wenming-hujian';
}

export function getDasiZhengkeTopic(topicId: unknown) {
  const id = isDasiZhengkeTopicId(topicId) ? topicId : DEFAULT_DASI_ZHENGKE_TOPIC_ID;
  return DASI_ZHENGKE_TOPICS.find((t) => t.id === id) ?? DASI_ZHENGKE_TOPICS[0];
}


