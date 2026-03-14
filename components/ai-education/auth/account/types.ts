// 账户相关类型定义

export interface UserInfo {
    name: string; // 姓名（登录名）
    gender?: string;
    grade?: string;
    className?: string;
    role: string;
    banned?: boolean;
    mustChangePassword?: boolean;
    managedClasses?: string[];
    subjects?: string[];
}

export interface MigratePreview {
    configured: boolean;
    collections?: { name: string; count: number; isGridFS: boolean }[];
    totalCollections?: number;
    totalDocuments?: number;
    message?: string;
}

export interface MigratedResult {
    success: boolean;
    count: number;
    error?: string;
}

// 获取角色名称
export const getRoleName = (role: string) => {
    switch (role) {
        case 'superadmin': return '超级管理员';
        case 'teacher': return '教师';
        case 'admin': return '管理员';
        default: return '学生';
    }
};

// 获取角色颜色
export const getRoleColor = (role: string) => {
    switch (role) {
        case 'superadmin': return 'text-purple-600 dark:text-purple-400';
        case 'teacher': return 'text-green-600 dark:text-green-400';
        case 'admin': return 'text-blue-600 dark:text-blue-400';
        default: return 'text-muted-foreground';
    }
};
