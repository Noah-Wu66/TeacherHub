"use client";
import Image from "next/image";
import { Shield, Sun, Moon, Monitor, Palette as ThemeIcon } from "lucide-react";
import { UserInfo, getRoleName, getRoleColor } from "./types";

interface UserInfoDisplayProps {
    user: UserInfo;
    theme: string;
    toggleTheme: () => void;
}

export default function UserInfoDisplay({ user, theme, toggleTheme }: UserInfoDisplayProps) {
    return (
        <div className="mb-6">
            {/* 两列布局 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                {/* 姓名（登录名） */}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm flex-shrink-0">👤</span>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">姓名</p>
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    </div>
                </div>

                {/* 性别 */}
                {user.gender && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm flex-shrink-0">{user.gender === '男' ? '👨' : '👩'}</span>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">性别</p>
                            <p className="text-sm font-medium text-foreground">{user.gender}</p>
                        </div>
                    </div>
                )}

                {/* 角色 */}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">角色</p>
                        <p className={`text-sm font-medium truncate ${getRoleColor(user.role)}`}>
                            {getRoleName(user.role)}
                        </p>
                    </div>
                </div>

                {/* 年级 */}
                {user.grade && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Image src="/ai-education/study.png" alt="年级" width={16} height={16} className="object-contain flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">年级</p>
                            <p className="text-sm font-medium text-foreground truncate">{user.grade}</p>
                        </div>
                    </div>
                )}

                {/* 班级 */}
                {(user.className || (user.managedClasses && user.managedClasses.length > 0)) && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm flex-shrink-0">🏫</span>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">班级</p>
                            <p className="text-sm font-medium text-foreground truncate">
                                {user.className || (user.managedClasses && user.managedClasses.sort((a, b) => parseInt(a) - parseInt(b)).join('、'))}
                            </p>
                        </div>
                    </div>
                )}

                {/* 任教学科 - 教师专属 */}
                {user.role === 'teacher' && user.subjects && user.subjects.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm flex-shrink-0">📖</span>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">任教学科</p>
                            <p className="text-sm font-medium text-foreground truncate">
                                {user.subjects.join('、')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* 主题切换 */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <ThemeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">外观</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                            {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '系统'}
                        </span>
                        <button
                            onClick={toggleTheme}
                            className="p-1 hover:bg-background rounded-md transition-colors border border-transparent hover:border-border"
                            title="切换主题"
                        >
                            {theme === 'light' ? (
                                <Sun className="h-4 w-4 text-amber-500" />
                            ) : theme === 'dark' ? (
                                <Moon className="h-4 w-4 text-blue-400" />
                            ) : (
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
