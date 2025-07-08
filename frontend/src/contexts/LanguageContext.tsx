import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 支持的语言类型 - 导出以供其他文件使用
export type Language = 'zh' | 'en';

// 语言上下文接口
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// 创建语言上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 多语言资源类型
type TranslationKeys = {
  // 通用
  'common.save': string;
  'common.cancel': string;
  'common.close': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.confirm': string;
  'common.edit': string;
  'common.delete': string;
  'common.search': string;
  'common.back': string;
  'common.next': string;
  'common.prev': string;
  'common.submit': string;
  'common.reset': string;
  
  // 导航
  'nav.dashboard': string;
  'nav.teams': string;
  'nav.channels': string;
  'nav.messages': string;
  'nav.settings': string;
  'nav.profile': string;
  'nav.logout': string;
  'nav.back': string;
  'nav.notifications': string;
  
  // 仪表盘
  'dashboard.title': string;
  'dashboard.subtitle': string;
  'dashboard.welcome': string;
  'dashboard.welcome.title': string;
  'dashboard.teams.title': string;
  'dashboard.teams.description': string;
  'dashboard.channels.title': string;
  'dashboard.channels.description': string;
  'dashboard.messages.title': string;
  'dashboard.messages.description': string;
  'dashboard.stats.teams': string;
  'dashboard.stats.channels': string;
  'dashboard.stats.messages': string;
  
  // 认证
  'auth.login.title': string;
  'auth.login.subtitle': string;
  'auth.login.email': string;
  'auth.login.password': string;
  'auth.login.remember': string;
  'auth.login.forgot': string;
  'auth.login.submit': string;
  'auth.login.signup': string;
  'auth.login.username': string;
  'auth.login.username.placeholder': string;
  'auth.login.password.placeholder': string;
  'auth.login.submitting': string;
  'auth.register.title': string;
  'auth.register.subtitle': string;
  'auth.register.fullname': string;
  'auth.register.email': string;
  'auth.register.password': string;
  'auth.register.confirm': string;
  'auth.register.submit': string;
  'auth.register.login': string;
  'auth.register.username': string;
  'auth.register.username.placeholder': string;
  'auth.register.fullname.placeholder': string;
  'auth.register.email.placeholder': string;
  'auth.register.password.placeholder': string;
  'auth.register.confirm.placeholder': string;
  'auth.register.submitting': string;
  
  // 表单验证
  'validation.required.username': string;
  'validation.required.fullname': string;
  'validation.required.email': string;
  'validation.required.password': string;
  'validation.required.confirmPassword': string;
  'validation.minLength.username': string;
  'validation.minLength.password': string;
  'validation.maxLength.username': string;
  'validation.maxLength.fullname': string;
  'validation.invalid.email': string;
  'validation.password.mismatch': string;
  'validation.fullname.empty': string;
  
  // 设置
  'settings.title': string;
  'settings.subtitle': string;
  'settings.profile.title': string;
  'settings.profile.description': string;
  'settings.profile.loading': string;
  'settings.profile.avatar.change': string;
  'settings.profile.username': string;
  'settings.profile.username.readonly': string;
  'settings.profile.userid': string;
  'settings.profile.userid.readonly': string;
  'settings.profile.email': string;
  'settings.profile.email.readonly': string;
  'settings.profile.fullname': string;
  'settings.profile.fullname.placeholder': string;
  'settings.profile.timezone': string;
  'settings.profile.timezone.placeholder': string;
  'settings.profile.bio': string;
  'settings.profile.bio.placeholder': string;
  'settings.profile.avatar_url': string;
  'settings.profile.avatar_url.placeholder': string;
  'settings.profile.save': string;
  'settings.profile.saving': string;
  'settings.profile.reset': string;
  'settings.profile.success': string;
  'settings.profile.no_changes': string;
  'settings.profile.error': string;
  'settings.security.title': string;
  'settings.security.description': string;
  'settings.security.note': string;
  'settings.notifications.title': string;
  'settings.notifications.description': string;
  'settings.notifications.note': string;
  'settings.appearance.title': string;
  'settings.appearance.description': string;
  
  // 个人资料验证
  'profile.validation.fullname.required': string;
  'profile.validation.fullname.minLength': string;
  'profile.validation.fullname.maxLength': string;
  'profile.validation.timezone.maxLength': string;
  'profile.validation.bio.maxLength': string;
  'profile.validation.avatar_url.maxLength': string;
  
  // 外观设置
  'appearance.title': string;
  'appearance.subtitle': string;
  'appearance.theme.title': string;
  'appearance.theme.light': string;
  'appearance.theme.light.desc': string;
  'appearance.theme.dark': string;
  'appearance.theme.dark.desc': string;
  'appearance.language.title': string;
  'appearance.language.subtitle': string;
  'appearance.language.chinese': string;
  'appearance.language.english': string;
  'appearance.font.title': string;
  'appearance.font.size': string;
  'appearance.font.small': string;
  'appearance.font.medium': string;
  'appearance.font.large': string;
  'appearance.animation.title': string;
  'appearance.animation.enable': string;
  'appearance.animation.enable.desc': string;
  'appearance.animation.reduce': string;
  'appearance.animation.reduce.desc': string;
  'appearance.tip.title': string;
  'appearance.tip.content': string;
  
  // 团队
  'teams.title': string;
  'teams.create': string;
  'teams.join': string;
  'teams.leave': string;
  'teams.members': string;
  'teams.channels': string;
  'teams.settings': string;
  'teams.list.title': string;
  'teams.list.empty': string;
  'teams.list.create_first': string;
  'teams.list.view_details': string;
  'teams.members.title': string;
  'teams.members.count': string;
  'teams.members.empty': string;
  'teams.members.invite_first': string;
  'teams.members.remove': string;
  'teams.members.remove_confirm': string;
  'teams.members.remove_confirm_text': string;
  'teams.members.you': string;
  'teams.roles.owner': string;
  'teams.roles.admin': string;
  'teams.roles.member': string;
  'teams.roles.guest': string;
  'teams.create.title': string;
  'teams.create.name': string;
  'teams.create.name.placeholder': string;
  'teams.create.name.required': string;
  'teams.create.name.minLength': string;
  'teams.create.name.maxLength': string;
  'teams.create.slug': string;
  'teams.create.slug.auto': string;
  'teams.create.slug.regenerate': string;
  'teams.create.slug.required': string;
  'teams.create.slug.minLength': string;
  'teams.create.slug.maxLength': string;
  'teams.create.slug.pattern': string;
  'teams.create.slug.placeholder': string;
  'teams.create.slug.preview': string;
  'teams.create.description': string;
  'teams.create.description.placeholder': string;
  'teams.create.description.required': string;
  'teams.create.description.minLength': string;
  'teams.create.description.maxLength': string;
  'teams.create.creating': string;
  'teams.invite.title': string;
  'teams.invite.userid': string;
  'teams.invite.userid.placeholder': string;
  'teams.invite.userid.hint': string;
  'teams.invite.userid.location': string;
  'teams.invite.role': string;
  'teams.invite.role.admin': string;
  'teams.invite.role.member': string;
  'teams.invite.role.guest': string;
  'teams.invite.role.admin.desc': string;
  'teams.invite.role.member.desc': string;
  'teams.invite.role.guest.desc': string;
  'teams.invite.cancel': string;
  'teams.invite.send': string;
  'teams.invite.sending': string;
  'teams.invite.note.title': string;
  'teams.invite.note.register': string;
  'teams.invite.note.immediate': string;
  'teams.invite.note.change': string;
  'teams.invite.permission.insufficient': string;
  'teams.invite.permission.admin_only': string;
  'teams.invite.permission.current_role': string;
  'teams.invite.permission.unknown': string;
  'teams.invite.members.current': string;
  'teams.invite.notes.notification': string;
  'teams.invite.notes.response': string;
  'teams.invite.notes.manage': string;
  
  // 频道
  'channels.title': string;
  'channels.create': string;
  'channels.join': string;
  'channels.leave': string;
  'channels.members': string;
  'channels.settings': string;
  
  // 消息
  'messages.title': string;
  'messages.send': string;
  'messages.typing': string;
  'messages.online': string;
  'messages.offline': string;
  'teams.created_at': string;
  
  // 开发进度
  'progress.title': string;
  'progress.subtitle': string;
  'progress.completed': string;
  'progress.in_progress': string;
  'progress.planned': string;
  'progress.overall': string;
  'progress.stage1.title': string;
  'progress.stage1.subtitle': string;
  'progress.stage2.title': string;
  'progress.stage2.subtitle': string;
  'progress.stage3.title': string;
  'progress.stage3.subtitle': string;
  'progress.feature.auth': string;
  'progress.feature.teams': string;
  'progress.feature.channels': string;
  'progress.feature.messages': string;
  'progress.feature.websocket': string;
  'progress.feature.ui': string;
  'progress.feature.i18n': string;
  'progress.feature.ai_assistant': string;
  'progress.feature.smart_suggestions': string;
  'progress.feature.auto_summary': string;
  'progress.feature.intelligent_search': string;
  'progress.feature.workflow_automation': string;
  'progress.feature.code_integration': string;
  'progress.feature.virtual_spaces': string;
  'progress.feature.focus_rooms': string;
  'progress.feature.brainstorm_mode': string;
  'progress.feature.emotional_intelligence': string;
  'progress.feature.predictive_collaboration': string;
};

// 多语言资源
const translations: Record<Language, TranslationKeys> = {
  zh: {
    // 通用
    'common.save': '保存',
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.search': '搜索',
    'common.back': '返回',
    'common.next': '下一步',
    'common.prev': '上一步',
    'common.submit': '提交',
    'common.reset': '重置',
    
    // 导航
    'nav.dashboard': '仪表盘',
    'nav.teams': '团队',
    'nav.channels': '频道',
    'nav.messages': '消息',
    'nav.settings': '设置',
    'nav.profile': '个人资料',
    'nav.logout': '退出登录',
    'nav.back': '返回',
    'nav.notifications': '通知',
    
    // 仪表盘
    'dashboard.title': '欢迎来到 Huddle Up',
    'dashboard.subtitle': '开始您的团队协作之旅',
    'dashboard.welcome': '欢迎',
    'dashboard.welcome.title': '欢迎',
    'dashboard.teams.title': '团队管理',
    'dashboard.teams.description': '创建和管理您的团队',
    'dashboard.channels.title': '频道管理',
    'dashboard.channels.description': '组织和管理团队频道',
    'dashboard.messages.title': '聊天室',
    'dashboard.messages.description': '实时消息和团队沟通',
    'dashboard.stats.teams': '团队数量',
    'dashboard.stats.channels': '频道数量',
    'dashboard.stats.messages': '消息数量',
    
    // 认证
    'auth.login.title': '登录',
    'auth.login.subtitle': '欢迎回来！请输入您的登录信息',
    'auth.login.email': '邮箱地址',
    'auth.login.password': '密码',
    'auth.login.remember': '记住我',
    'auth.login.forgot': '忘记密码？',
    'auth.login.submit': '登录',
    'auth.login.signup': '还没有账户？立即注册',
    'auth.login.username': '用户名',
    'auth.login.username.placeholder': '请输入用户名',
    'auth.login.password.placeholder': '请输入密码',
    'auth.login.submitting': '登录中...',
    'auth.register.title': '注册',
    'auth.register.subtitle': '创建新账户开始使用',
    'auth.register.fullname': '全名',
    'auth.register.email': '邮箱地址',
    'auth.register.password': '密码',
    'auth.register.confirm': '确认密码',
    'auth.register.submit': '注册',
    'auth.register.login': '已有账户？立即登录',
    'auth.register.username': '用户名',
    'auth.register.username.placeholder': '请输入用户名',
    'auth.register.fullname.placeholder': '请输入全名',
    'auth.register.email.placeholder': '请输入邮箱地址',
    'auth.register.password.placeholder': '请输入密码',
    'auth.register.confirm.placeholder': '请再次输入密码',
    'auth.register.submitting': '注册中...',
    
    // 表单验证
    'validation.required.username': '用户名不能为空',
    'validation.required.fullname': '全名不能为空',
    'validation.required.email': '邮箱地址不能为空',
    'validation.required.password': '密码不能为空',
    'validation.required.confirmPassword': '确认密码不能为空',
    'validation.minLength.username': '用户名至少需要 3 个字符',
    'validation.minLength.password': '密码至少需要 6 个字符',
    'validation.maxLength.username': '用户名最多 20 个字符',
    'validation.maxLength.fullname': '全名最多 50 个字符',
    'validation.invalid.email': '请输入有效的邮箱地址',
    'validation.password.mismatch': '两次输入的密码不一致',
    'validation.fullname.empty': '全名不能为空',
    
    // 设置
    'settings.title': '设置',
    'settings.subtitle': '管理您的账户和偏好设置',
    'settings.profile.title': '个人资料',
    'settings.profile.description': '管理您的基本信息和个人资料',
    'settings.profile.loading': '加载中...',
    'settings.profile.avatar.change': '更换头像',
    'settings.profile.username': '用户名',
    'settings.profile.username.readonly': '用户名不可修改',
    'settings.profile.userid': '用户ID',
    'settings.profile.userid.readonly': '用户ID不可修改',
    'settings.profile.email': '邮箱地址',
    'settings.profile.email.readonly': '邮箱地址不可修改',
    'settings.profile.fullname': '全名',
    'settings.profile.fullname.placeholder': '请输入全名',
    'settings.profile.timezone': '时区',
         'settings.profile.timezone.placeholder': '例如: Asia/Shanghai',
     'settings.profile.bio': '个人简介',
     'settings.profile.bio.placeholder': '介绍一下自己...',
    'settings.profile.avatar_url': '头像 URL',
    'settings.profile.avatar_url.placeholder': '请输入头像 URL',
    'settings.profile.save': '保存',
    'settings.profile.saving': '保存中...',
    'settings.profile.reset': '重置',
    'settings.profile.success': '个人资料更新成功！',
    'settings.profile.no_changes': '没有更改，无需保存',
    'settings.profile.error': '更新个人资料失败',
    'settings.security.title': '安全设置',
    'settings.security.description': '密码和安全选项',
    'settings.security.note': '请确保您的密码安全，并定期更换。',
    'settings.notifications.title': '通知设置',
    'settings.notifications.description': '管理您的通知偏好',
    'settings.notifications.note': '您可以在这里管理您的通知偏好，包括邮件、桌面和应用内通知。',
    'settings.appearance.title': '外观设置',
    'settings.appearance.description': '主题和显示选项',
    
    // 个人资料验证
    'profile.validation.fullname.required': '全名不能为空',
    'profile.validation.fullname.minLength': '全名至少需要 2 个字符',
    'profile.validation.fullname.maxLength': '全名最多 50 个字符',
    'profile.validation.timezone.maxLength': '时区最多 50 个字符',
    'profile.validation.bio.maxLength': '个人简介最多 200 个字符',
    'profile.validation.avatar_url.maxLength': '头像 URL 最多 255 个字符',
    
    // 外观设置
    'appearance.title': '外观设置',
    'appearance.subtitle': '自定义您的界面外观和体验',
    'appearance.theme.title': '主题模式',
    'appearance.theme.light': '浅色模式',
    'appearance.theme.light.desc': '经典的明亮界面',
    'appearance.theme.dark': '深色模式',
    'appearance.theme.dark.desc': '对眼睛更友好的深色界面',
    'appearance.language.title': '语言设置',
    'appearance.language.subtitle': '选择您的首选语言',
    'appearance.language.chinese': '中文',
    'appearance.language.english': '英文',
    'appearance.font.title': '字体设置',
    'appearance.font.size': '字体大小',
    'appearance.font.small': '小字体',
    'appearance.font.medium': '中字体',
    'appearance.font.large': '大字体',
    'appearance.animation.title': '动画效果',
    'appearance.animation.enable': '启用动画',
    'appearance.animation.enable.desc': '页面切换和交互动画效果',
    'appearance.animation.reduce': '减少动画',
    'appearance.animation.reduce.desc': '为敏感用户减少动画效果',
    'appearance.tip.title': '提示',
    'appearance.tip.content': '主题切换会立即生效。其他设置将在未来版本中提供更多自定义选项。',
    
    // 团队
    'teams.title': '团队管理',
    'teams.create': '创建团队',
    'teams.join': '加入团队',
    'teams.leave': '离开团队',
    'teams.members': '成员',
    'teams.channels': '频道',
    'teams.settings': '团队设置',
    'teams.list.title': '我的团队',
    'teams.list.empty': '您还没有加入任何团队',
    'teams.list.create_first': '创建您的第一个团队',
    'teams.list.view_details': '查看详情',
    'teams.members.title': '团队成员',
    'teams.members.count': '{{count}} 名成员',
    'teams.members.empty': '还没有团队成员',
    'teams.members.invite_first': '邀请第一个成员',
    'teams.members.remove': '移除成员',
    'teams.members.remove_confirm': '移除团队成员',
    'teams.members.remove_confirm_text': '确定要将此成员从团队中移除吗？此操作无法撤销。',
    'teams.members.you': '你',
    'teams.roles.owner': '所有者',
    'teams.roles.admin': '管理员',
    'teams.roles.member': '成员',
    'teams.roles.guest': '访客',
    'teams.create.title': '创建新团队',
    'teams.create.name': '团队名称',
    'teams.create.name.placeholder': '请输入团队名称',
    'teams.create.name.required': '团队名称是必填项',
    'teams.create.name.minLength': '团队名称至少需要2个字符',
    'teams.create.name.maxLength': '团队名称最多50个字符',
    'teams.create.slug': '团队标识符 (URL)',
    'teams.create.slug.auto': '自动生成',
    'teams.create.slug.regenerate': '重新生成',
    'teams.create.slug.required': '团队标识符是必填项',
    'teams.create.slug.minLength': '团队标识符至少需要3个字符',
    'teams.create.slug.maxLength': '团队标识符最多100个字符',
    'teams.create.slug.pattern': '只能包含小写字母、数字和横线',
    'teams.create.slug.placeholder': 'team-slug',
    'teams.create.slug.preview': '团队链接：',
    'teams.create.description': '团队描述',
    'teams.create.description.placeholder': '请输入团队描述，告诉大家这个团队是做什么的...',
    'teams.create.description.required': '团队描述是必填项',
    'teams.create.description.minLength': '团队描述至少需要10个字符',
    'teams.create.description.maxLength': '团队描述最多200个字符',
    'teams.create.creating': '创建中...',
    'teams.invite.title': '邀请成员',
    'teams.invite.userid': '用户ID',
    'teams.invite.userid.placeholder': '请输入用户ID',
    'teams.invite.userid.hint': '用户ID是您在系统中的唯一标识',
    'teams.invite.userid.location': '在您的个人资料中查看您的用户ID',
    'teams.invite.role': '角色',
    'teams.invite.role.admin': '管理员',
    'teams.invite.role.member': '成员',
    'teams.invite.role.guest': '访客',
    'teams.invite.role.admin.desc': '拥有团队所有权限，包括添加/移除成员、修改设置等',
    'teams.invite.role.member.desc': '可以参与团队活动，但无权修改团队设置',
    'teams.invite.role.guest.desc': '只能查看团队信息，无法参与团队活动',
    'teams.invite.cancel': '取消',
    'teams.invite.send': '发送邀请',
    'teams.invite.sending': '发送中...',
    'teams.invite.note.title': '邀请说明',
         'teams.invite.note.register': '如果您还没有账户，请先注册。',
     'teams.invite.note.immediate': '邀请将立即生效。',
     'teams.invite.note.change': '您可以随时在设置中更改您的角色。',
     'teams.invite.permission.insufficient': '权限不足：',
     'teams.invite.permission.admin_only': '只有团队所有者和管理员才能邀请新成员。',
     'teams.invite.permission.current_role': '您当前的角色是：',
     'teams.invite.permission.unknown': '未知',
     'teams.invite.members.current': '当前团队成员 (请勿重复邀请):',
     'teams.invite.notes.notification': '邀请将发送通知给用户，用户需要确认后才能加入团队',
     'teams.invite.notes.response': '被邀请用户可以在通知中心查看并响应邀请',
     'teams.invite.notes.manage': '您可以随时在团队设置中管理成员角色',
     
     // 频道
     'channels.title': '频道管理',
     'channels.create': '创建频道',
     'channels.join': '加入频道',
     'channels.leave': '离开频道',
     'channels.members': '成员',
     'channels.settings': '频道设置',
     
     // 消息
     'messages.title': '消息',
     'messages.send': '发送消息',
     'messages.typing': '正在输入...',
     'messages.online': '在线',
     'messages.offline': '离线',
     'teams.created_at': '创建于 {{date}}',
     
     // 开发进度
     'progress.title': '🚀 开发进度',
     'progress.subtitle': '产品功能开发计划',
     'progress.completed': '✓ 已完成',
     'progress.in_progress': '🚀 开发中',
     'progress.planned': '📅 计划中',
     'progress.overall': '总体进度',
     'progress.stage1.title': '第一阶段：AI智能基础',
     'progress.stage1.subtitle': '智能消息建议、自动摘要、语义搜索',
     'progress.stage2.title': '第二阶段：工作流革命',
     'progress.stage2.subtitle': '内置项目管理、代码协作、自动化工作流',
     'progress.stage3.title': '第三阶段：沉浸式体验',
     'progress.stage3.subtitle': '虚拟协作空间、AR/VR支持、高级AI分析',
     'progress.feature.auth': '用户认证系统',
     'progress.feature.teams': '团队管理功能',
     'progress.feature.channels': '频道管理',
     'progress.feature.messages': '实时聊天',
     'progress.feature.websocket': 'WebSocket实时通信',
     'progress.feature.ui': 'UI优化升级',
     'progress.feature.i18n': '中英文切换',
     'progress.feature.ai_assistant': 'AI智能助手',
     'progress.feature.smart_suggestions': '智能消息建议',
     'progress.feature.auto_summary': '自动会议纪要',
     'progress.feature.intelligent_search': '智能语义搜索',
     'progress.feature.workflow_automation': '工作流自动化',
     'progress.feature.code_integration': '代码协作集成',
     'progress.feature.virtual_spaces': '虚拟协作空间',
     'progress.feature.focus_rooms': '专注房间',
     'progress.feature.brainstorm_mode': '头脑风暴模式',
     'progress.feature.emotional_intelligence': '情感智能分析',
     'progress.feature.predictive_collaboration': '预测性协作',
  },
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.prev': 'Previous',
    'common.submit': 'Submit',
    'common.reset': 'Reset',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.teams': 'Teams',
    'nav.channels': 'Channels',
    'nav.messages': 'Messages',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'nav.back': 'Back',
    'nav.notifications': 'Notifications',
    
    // Dashboard
    'dashboard.title': 'Welcome to Huddle Up',
    'dashboard.subtitle': 'Start your team collaboration journey',
    'dashboard.welcome': 'Welcome',
    'dashboard.welcome.title': 'Welcome',
    'dashboard.teams.title': 'Team Management',
    'dashboard.teams.description': 'Create and manage your teams',
    'dashboard.channels.title': 'Channel Management',
    'dashboard.channels.description': 'Organize and manage team channels',
    'dashboard.messages.title': 'Chat Room',
    'dashboard.messages.description': 'Real-time messaging and team communication',
    'dashboard.stats.teams': 'Teams',
    'dashboard.stats.channels': 'Channels',
    'dashboard.stats.messages': 'Messages',
    
    // Authentication
    'auth.login.title': 'Login',
    'auth.login.subtitle': 'Welcome back! Please enter your login details',
    'auth.login.email': 'Email Address',
    'auth.login.password': 'Password',
    'auth.login.remember': 'Remember me',
    'auth.login.forgot': 'Forgot password?',
    'auth.login.submit': 'Login',
    'auth.login.signup': "Don't have an account? Sign up now",
    'auth.login.username': 'Username',
    'auth.login.username.placeholder': 'Enter your username',
    'auth.login.password.placeholder': 'Enter your password',
    'auth.login.submitting': 'Logging in...',
    'auth.register.title': 'Register',
    'auth.register.subtitle': 'Create a new account to get started',
    'auth.register.fullname': 'Full Name',
    'auth.register.email': 'Email Address',
    'auth.register.password': 'Password',
    'auth.register.confirm': 'Confirm Password',
    'auth.register.submit': 'Register',
    'auth.register.login': 'Already have an account? Login now',
    'auth.register.username': 'Username',
    'auth.register.username.placeholder': 'Enter your username',
    'auth.register.fullname.placeholder': 'Enter your full name',
    'auth.register.email.placeholder': 'Enter your email address',
    'auth.register.password.placeholder': 'Enter your password',
    'auth.register.confirm.placeholder': 'Enter your password again',
    'auth.register.submitting': 'Registering...',
    
    // Form Validation
    'validation.required.username': 'Username cannot be empty',
    'validation.required.fullname': 'Full name cannot be empty',
    'validation.required.email': 'Email address cannot be empty',
    'validation.required.password': 'Password cannot be empty',
    'validation.required.confirmPassword': 'Confirm password cannot be empty',
    'validation.minLength.username': 'Username must be at least 3 characters',
    'validation.minLength.password': 'Password must be at least 6 characters',
    'validation.maxLength.username': 'Username can be up to 20 characters',
    'validation.maxLength.fullname': 'Full name can be up to 50 characters',
    'validation.invalid.email': 'Please enter a valid email address',
    'validation.password.mismatch': 'Passwords do not match',
    'validation.fullname.empty': 'Full name cannot be empty',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account and preferences',
    'settings.profile.title': 'Profile',
    'settings.profile.description': 'Manage your basic information and profile',
    'settings.profile.loading': 'Loading...',
    'settings.profile.avatar.change': 'Change Avatar',
    'settings.profile.username': 'Username',
    'settings.profile.username.readonly': 'Username cannot be changed',
    'settings.profile.userid': 'User ID',
    'settings.profile.userid.readonly': 'User ID cannot be changed',
    'settings.profile.email': 'Email Address',
    'settings.profile.email.readonly': 'Email address cannot be changed',
    'settings.profile.fullname': 'Full Name',
    'settings.profile.fullname.placeholder': 'Enter your full name',
    'settings.profile.timezone': 'Timezone',
         'settings.profile.timezone.placeholder': 'e.g. Asia/Shanghai',
    'settings.profile.bio': 'Bio',
    'settings.profile.bio.placeholder': 'Enter your bio',
    'settings.profile.avatar_url': 'Avatar URL',
    'settings.profile.avatar_url.placeholder': 'Enter avatar URL',
    'settings.profile.save': 'Save',
    'settings.profile.saving': 'Saving...',
    'settings.profile.reset': 'Reset',
    'settings.profile.success': 'Profile updated successfully!',
    'settings.profile.no_changes': 'No changes, nothing to save',
    'settings.profile.error': 'Failed to update profile',
    'settings.security.title': 'Security',
    'settings.security.description': 'Password and security options',
    'settings.security.note': 'Please ensure your password is secure and change it regularly.',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.description': 'Manage your notification preferences',
    'settings.notifications.note': 'You can manage your notification preferences here, including email, desktop, and in-app notifications.',
    'settings.appearance.title': 'Appearance',
    'settings.appearance.description': 'Theme and display options',
    
    // Profile Validation
    'profile.validation.fullname.required': 'Full name cannot be empty',
    'profile.validation.fullname.minLength': 'Full name must be at least 2 characters',
    'profile.validation.fullname.maxLength': 'Full name can be up to 50 characters',
    'profile.validation.timezone.maxLength': 'Timezone can be up to 50 characters',
    'profile.validation.bio.maxLength': 'Bio can be up to 200 characters',
    'profile.validation.avatar_url.maxLength': 'Avatar URL can be up to 255 characters',
    
    // Appearance Settings
    'appearance.title': 'Appearance Settings',
    'appearance.subtitle': 'Customize your interface appearance and experience',
    'appearance.theme.title': 'Theme Mode',
    'appearance.theme.light': 'Light Mode',
    'appearance.theme.light.desc': 'Classic bright interface',
    'appearance.theme.dark': 'Dark Mode',
    'appearance.theme.dark.desc': 'Eye-friendly dark interface',
    'appearance.language.title': 'Language Settings',
    'appearance.language.subtitle': 'Choose your preferred language',
    'appearance.language.chinese': 'Chinese',
    'appearance.language.english': 'English',
    'appearance.font.title': 'Font Settings',
    'appearance.font.size': 'Font Size',
    'appearance.font.small': 'Small Font',
    'appearance.font.medium': 'Medium Font',
    'appearance.font.large': 'Large Font',
    'appearance.animation.title': 'Animation Effects',
    'appearance.animation.enable': 'Enable Animations',
    'appearance.animation.enable.desc': 'Page transitions and interaction animations',
    'appearance.animation.reduce': 'Reduce Animations',
    'appearance.animation.reduce.desc': 'Reduce animations for sensitive users',
    'appearance.tip.title': 'Tip',
    'appearance.tip.content': 'Theme changes take effect immediately. Other settings will provide more customization options in future versions.',
    
    // Teams
    'teams.title': 'Team Management',
    'teams.create': 'Create Team',
    'teams.join': 'Join Team',
    'teams.leave': 'Leave Team',
    'teams.members': 'Members',
    'teams.channels': 'Channels',
    'teams.settings': 'Team Settings',
    'teams.list.title': 'Team List',
    'teams.list.empty': 'You have no teams, please create one!',
    'teams.list.create_first': 'Create your first team',
    'teams.list.view_details': 'View Details',
    'teams.members.title': 'Team Members',
    'teams.members.count': '{{count}} members',
    'teams.members.empty': 'No members in this team yet',
    'teams.members.invite_first': 'Invite Members',
    'teams.members.remove': 'Remove',
    'teams.members.remove_confirm': 'Are you sure you want to remove this member?',
    'teams.members.remove_confirm_text': 'Removing this member will revoke their team access.',
    'teams.members.you': 'You',
    'teams.roles.owner': 'Team Owner',
    'teams.roles.admin': 'Admin',
    'teams.roles.member': 'Member',
    'teams.roles.guest': 'Guest',
    'teams.create.title': 'Create Team',
    'teams.create.name': 'Team Name',
    'teams.create.name.placeholder': 'e.g. Huddle Up Team',
    'teams.create.name.required': 'Team name cannot be empty',
    'teams.create.name.minLength': 'Team name must be at least 3 characters',
    'teams.create.name.maxLength': 'Team name can be up to 50 characters',
    'teams.create.slug': 'Team Identifier',
    'teams.create.slug.auto': 'Auto-generate',
    'teams.create.slug.regenerate': 'Regenerate',
    'teams.create.slug.required': 'Team identifier cannot be empty',
    'teams.create.slug.minLength': 'Team identifier must be at least 3 characters',
    'teams.create.slug.maxLength': 'Team identifier can be up to 20 characters',
    'teams.create.slug.pattern': 'Team identifier can only contain lowercase letters, numbers, and hyphens',
    'teams.create.slug.placeholder': 'e.g. huddle-up-team',
    'teams.create.slug.preview': 'Preview',
    'teams.create.description': 'Team Description',
    'teams.create.description.placeholder': 'Describe your team to other members...',
    'teams.create.description.required': 'Team description cannot be empty',
    'teams.create.description.minLength': 'Team description must be at least 10 characters',
    'teams.create.description.maxLength': 'Team description can be up to 200 characters',
    'teams.create.creating': 'Creating...',
    'teams.invite.title': 'Invite Members',
    'teams.invite.userid': 'User ID',
    'teams.invite.userid.placeholder': 'Enter User ID',
    'teams.invite.userid.hint': 'User ID is your unique identifier in the system',
    'teams.invite.userid.location': 'View your User ID in your profile',
    'teams.invite.role': 'Role',
    'teams.invite.role.admin': 'Admin',
    'teams.invite.role.member': 'Member',
    'teams.invite.role.guest': 'Guest',
    'teams.invite.role.admin.desc': 'Has full team ownership, including adding/removing members, modifying settings, etc.',
    'teams.invite.role.member.desc': 'Can participate in team activities, but cannot modify team settings',
    'teams.invite.role.guest.desc': 'Can only view team information, cannot participate in team activities',
    'teams.invite.cancel': 'Cancel',
    'teams.invite.send': 'Send Invitation',
    'teams.invite.sending': 'Sending...',
    'teams.invite.note.title': 'Invitation Note',
         'teams.invite.note.register': 'If you do not have an account, please register first.',
     'teams.invite.note.immediate': 'The invitation will take effect immediately.',
     'teams.invite.note.change': 'You can change your role at any time in the settings.',
     'teams.invite.permission.insufficient': 'You do not have sufficient permissions to send an invitation.',
     'teams.invite.permission.admin_only': 'Only admins can send invitations.',
     'teams.invite.permission.current_role': 'Your current role is {{role}}, you cannot send an invitation.',
     'teams.invite.permission.unknown': 'Cannot determine your role, please try again later.',
     'teams.invite.members.current': 'Current team members',
     'teams.invite.notes.notification': 'Notifications',
     'teams.invite.notes.response': 'Responses',
     'teams.invite.notes.manage': 'Manage',
     
     // Channels
     'channels.title': 'Channel Management',
     'channels.create': 'Create Channel',
     'channels.join': 'Join Channel',
     'channels.leave': 'Leave Channel',
     'channels.members': 'Members',
     'channels.settings': 'Channel Settings',
     
     // Messages
     'messages.title': 'Messages',
     'messages.send': 'Send Message',
     'messages.typing': 'Typing...',
     'messages.online': 'Online',
     'messages.offline': 'Offline',
     'teams.created_at': 'Created at {{date}}',
     
     // Development Progress
     'progress.title': '🚀 Development Progress',
     'progress.subtitle': 'Product Feature Development Plan',
     'progress.completed': '✓ Completed',
     'progress.in_progress': '🚀 In Progress',
     'progress.planned': '📅 Planned',
     'progress.overall': 'Overall Progress',
     'progress.stage1.title': 'Stage 1: AI Intelligence Foundation',
     'progress.stage1.subtitle': 'Smart message suggestions, auto summaries, semantic search',
     'progress.stage2.title': 'Stage 2: Workflow Revolution',
     'progress.stage2.subtitle': 'Built-in project management, code collaboration, workflow automation',
     'progress.stage3.title': 'Stage 3: Immersive Experience',
     'progress.stage3.subtitle': 'Virtual collaboration spaces, AR/VR support, advanced AI analytics',
     'progress.feature.auth': 'User Authentication System',
     'progress.feature.teams': 'Team Management',
     'progress.feature.channels': 'Channel Management',
     'progress.feature.messages': 'Real-time Chat',
     'progress.feature.websocket': 'WebSocket Real-time Communication',
     'progress.feature.ui': 'UI Optimization',
     'progress.feature.i18n': 'Chinese/English Switch',
     'progress.feature.ai_assistant': 'AI Smart Assistant',
     'progress.feature.smart_suggestions': 'Smart Message Suggestions',
     'progress.feature.auto_summary': 'Auto Meeting Summary',
     'progress.feature.intelligent_search': 'Intelligent Semantic Search',
     'progress.feature.workflow_automation': 'Workflow Automation',
     'progress.feature.code_integration': 'Code Collaboration Integration',
     'progress.feature.virtual_spaces': 'Virtual Collaboration Spaces',
     'progress.feature.focus_rooms': 'Focus Rooms',
     'progress.feature.brainstorm_mode': 'Brainstorm Mode',
     'progress.feature.emotional_intelligence': 'Emotional Intelligence Analytics',
     'progress.feature.predictive_collaboration': 'Predictive Collaboration',
  },
};

// 语言提供者组件
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'zh';
  });

  // 保存语言设置到本地存储
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key as keyof TranslationKeys] || key;
    
    // 参数替换
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }
    
    return translation;
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// 使用语言上下文的 Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 