/**
 * 建科 ELN 数据管理平台 — API 客户端（Cebian 扩展内置）
 *
 * 服务器: http://10.1.228.52:13002
 * Base URL: /api/v1/
 * 认证: Authorization: Bearer <token>（token 从 localStorage['taurus_auth_token'] 获取）
 *
 * 所有端点已于 2026-08-20 通过实际 HTTP 调用验证。
 * LIMS 系统 (10.1.228.22) 是独立服务端，不在本模块范围内。
 *
 * 文件结构：
 *   第一部分 — 通用类型
 *   第二部分 — 认证类型
 *   第三部分 — 分类类型
 *   第四部分 — 模板类型
 *   第五部分 — 提交日志类型
 *   第六部分 — 请求参数类型
 *   第七部分 — ElnApiClient 类
 *     7.1  构造与配置
 *     7.2  底层请求方法
 *     7.3  认证 API（2 个端点）
 *     7.4  分类 API（3 个端点）
 *     7.5  模板 API（8 个端点）
 *     7.6  提交日志 API（1 个端点）
 *     7.7  预览 API（1 个端点）
 *     7.8  便捷查询方法
 *     7.9  高级流程方法（5 个场景）
 */

import { ElnApiError, ElnAuthError, ElnNetworkError, isNetworkError } from './errors';

// ============================================================
// 第一部分：通用类型
// ============================================================

/** API 统一响应包装 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  errorMessage: string;
  errorCode: number;
  timestamp?: string;
  path?: string;
  method?: string;
}

/** 分页请求参数 */
export interface PaginationParams {
  current?: number;
  pageSize?: number;
}

/** 分页响应数据 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
}

// ============================================================
// 第二部分：认证类型
// ============================================================

export interface LoginRequest {
  username: string;
  password: string;
}

/** 登录响应 — 仅返回 success: true，不含 token */
export interface LoginResponse {
  success: boolean;
  errorMessage: string;
  errorCode: number;
}

/** Token 提供者（需通过浏览器自动化实现） */
export interface TokenProvider {
  /** 获取 JWT token，内部应通过浏览器自动化登录并从 localStorage 提取 */
  getToken(): Promise<string>;
}

// ============================================================
// 第三部分：分类类型
// ============================================================

export interface Category {
  id: number;
  name: string;
  sort: number;
  remark: string | null;
}

export interface CategoryTreeNode {
  categoryId: number;
  categoryName: string;
  sampleCount: number;
  templateCount: number;
}

export interface Sample {
  categoryId: number;
  categoryName: string;
  name: string;
  templateCount: number;
}

// ============================================================
// 第四部分：模板类型
// ============================================================

export enum TemplateStatus {
  Draft = 1,
  Active = 2,
}

export enum VersionStatus {
  Draft = 1,
  Active = 2,
}

export interface FormilySchema {
  form: {
    labelCol?: number;
    wrapperCol?: number;
    labelWrap?: boolean;
    fullness?: boolean;
    wrapperWrap?: boolean;
    wrapperWidth?: string;
    [key: string]: unknown;
  };
  schema: {
    type: string;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface ExpressionItem {
  id: number | string;
  name: string;
  title: string;
  expression: string;
  writeFormValue: string;
  variables: ExpressionVariable[];
}

export interface ExpressionVariable {
  name: string;
  value: string;
  type: string;
}

export interface OutputItem {
  id: number | string;
  name: string;
}

export interface DetectionDateItem {
  id: number | string;
  title: string;
  path: string;
  component: 'DatePicker' | 'DatePicker.RangePicker';
  valueKind: 'single' | 'range' | 'start' | 'end';
}

export interface DetectionDateConfig {
  missingPolicy: 'block' | 'warnOnly' | 'ignore';
  outputFormat?: string;
  items: DetectionDateItem[];
}

export interface ExtraConfig {
  expressionItems: ExpressionItem[];
  outputItems: OutputItem[];
  detectionDateConfig: DetectionDateConfig | null;
}

export interface TableTemplateJson {
  rows?: Record<string, unknown>;
  cols?: Record<string, unknown>;
  styles?: unknown[];
  cells?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

export interface TemplateVersion {
  id: number;
  formTemplateId: number;
  version: number;
  status: VersionStatus;
  controlledNo: string;
  formTemplateJson: FormilySchema | null;
  tableTemplateJson: TableTemplateJson | null;
  extra: ExtraConfig | null;
  creatorName: string;
  creatorId: number;
  updaterName: string;
  updaterId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FormTemplate {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  testingItemName: string;
  spec: string;
  remark: string | null;
  type: number;
  status: TemplateStatus;
  controlledNo: string;
  version: number;
  activeVersionId: number | null;
  activeVersion: TemplateVersion | null;
  draftVersion: TemplateVersion | null;
  currentVersion: TemplateVersion | null;
  formTemplateJson: FormilySchema | null;
  tableTemplateJson: TableTemplateJson | null;
  creatorName: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
}

/** 模板预览会话 */
export interface PreviewSession {
  token: string;
  expiredAt: string;
}

// ============================================================
// 第五部分：提交日志类型
// ============================================================

export interface SubmissionLog {
  id: number;
  submissionAttemptId: string;
  submissionType: string;
  creatorId: number;
  creatorName: string;
  createdAt: string;
  finishedAt: string;
  commitId: number;
  taskId: number;
  sampleId: number;
  [key: string]: unknown;
}

// ============================================================
// 第六部分：请求参数类型
// ============================================================

export interface CreateTemplateRequest {
  sampleName: string;
  categoryId: number;
  testingItemName: string;
  controlledNumber?: string;
  standard?: string;
  outputValue?: string;
}

export interface SaveTemplateVersionRequest {
  extra: ExtraConfig;
  formTemplateJson: FormilySchema;
  tableTemplateJson: TableTemplateJson;
  controlledNo?: string;
}

export interface UpdateTemplateRequest {
  remark?: string | null;
  spec?: string;
  testingItemName?: string;
}

export interface SearchTemplatesParams extends PaginationParams {
  categoryId?: number;
  name?: string;
}

export interface ListTemplatesParams extends PaginationParams {
  categoryId?: number;
  name?: string;
}

// ============================================================
// 第七部分：ElnApiClient 类
// ============================================================

export class ElnApiClient {
  private baseUrl: string;
  private token: string | null;
  private tokenProvider: TokenProvider | null;

  // ----------------------------------------------------------
  // 7.1 构造与配置
  // ----------------------------------------------------------

  /** 创建 API 客户端，可选注入 TokenProvider 自动获取 token */
  constructor(
    baseUrl = 'http://10.1.228.52:13002/api/v1',
    tokenProvider?: TokenProvider
  ) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.tokenProvider = tokenProvider ?? null;
  }

  /** 设置 TokenProvider（用于自动获取 token） */
  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  /** 手动设置 JWT token */
  setToken(token: string): void {
    this.token = token;
  }

  /** 获取当前 token */
  getToken(): string | null {
    return this.token;
  }

  /** 检查 token 是否已设置 */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /** 确保 token 可用：无 token 时通过 TokenProvider 获取 */
  private async ensureToken(): Promise<void> {
    if (!this.token && this.tokenProvider) {
      this.token = await this.tokenProvider.getToken();
    }
  }

  // ----------------------------------------------------------
  // 7.2 底层请求方法
  // ----------------------------------------------------------

  /** 发送 HTTP 请求并解析 ApiResponse */
  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: unknown;
      params?: Record<string, string | number | undefined>;
    }
  ): Promise<ApiResponse<T>> {
    await this.ensureToken();

    const url = new URL(`${this.baseUrl}${path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (err) {
      throw new ElnNetworkError('ELN API 网络请求失败', err);
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json() as ApiResponse<T>;
    } catch {
      throw new ElnApiError(
        `ELN API 响应非 JSON (HTTP ${response.status})`,
        response.status,
      );
    }

    if (!response.ok) {
      throw new ElnApiError(
        data.errorMessage || `ELN API HTTP ${response.status}`,
        response.status,
        data.errorCode,
      );
    }

    if (!data.success && response.status === 401) {
      throw new ElnAuthError(data.errorMessage || 'ELN 认证失败');
    }

    return data;
  }

  // ----------------------------------------------------------
  // 7.3 认证 API
  // ----------------------------------------------------------

  /**
   * 登录
   * POST /api/v1/auth/login-lmis
   *
   * 响应体仅返回 { success: true }，不含 token。
   * Token 由前端写入 localStorage['taurus_auth_token']。
   * 需通过 TokenProvider（浏览器自动化）获取 token。
   */
  async login(req: LoginRequest): Promise<LoginResponse> {
    const res = await this.request<null>('/auth/login-lmis', {
      method: 'POST',
      body: req,
    });
    return {
      success: res.success,
      errorMessage: res.errorMessage,
      errorCode: res.errorCode,
    };
  }

  /** 检查 token 有效性 */
  async checkAuth(): Promise<boolean> {
    if (!this.token && !this.tokenProvider) return false;
    try {
      await this.ensureToken();
      const res = await this.listCategories();
      if (res.success) return true;
      if (res.errorCode === 401 || res.errorMessage?.includes('401')) {
        throw new ElnAuthError(res.errorMessage || 'ELN token 无效');
      }
      return false;
    } catch (err) {
      if (err instanceof ElnAuthError) throw err;
      if (isNetworkError(err)) throw err;
      return false;
    }
  }

  // ----------------------------------------------------------
  // 7.4 分类 API
  // ----------------------------------------------------------

  /** GET /api/v1/template-category — 分类列表 */
  async listCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<Category[]>('/template-category', { method: 'GET' });
  }

  /** GET /api/v1/form-template/categories — 分类树（分类 > 样品） */
  async getCategoryTree(): Promise<ApiResponse<CategoryTreeNode[]>> {
    return this.request<CategoryTreeNode[]>('/form-template/categories', { method: 'GET' });
  }

  /** GET /api/v1/form-template/samples?categoryId={id} — 按分类获取样品 */
  async listSamples(categoryId: number): Promise<ApiResponse<Sample[]>> {
    return this.request<Sample[]>('/form-template/samples', {
      method: 'GET',
      params: { categoryId },
    });
  }

  // ----------------------------------------------------------
  // 7.5 模板 API
  // ----------------------------------------------------------

  /** GET /api/v1/form-template — 分页查询模板列表 */
  async listTemplates(params: ListTemplatesParams = {}): Promise<ApiResponse<PaginatedData<FormTemplate>>> {
    return this.request<PaginatedData<FormTemplate>>('/form-template', {
      method: 'GET',
      params: {
        current: params.current ?? 1,
        pageSize: params.pageSize ?? 20,
        categoryId: params.categoryId,
        name: params.name,
      },
    });
  }

  /**
   * GET /api/v1/form-template/{id} — 模板详情
   * 返回 activeVersion / draftVersion / currentVersion
   */
  async getTemplateDetail(id: number): Promise<ApiResponse<FormTemplate>> {
    return this.request<FormTemplate>(`/form-template/${id}`, { method: 'GET' });
  }

  /** PATCH /api/v1/form-template/{id} — 更新模板元数据（不改 Schema） */
  async updateTemplate(
    id: number,
    req: UpdateTemplateRequest
  ): Promise<ApiResponse<FormTemplate>> {
    return this.request<FormTemplate>(`/form-template/${id}`, {
      method: 'PATCH',
      body: req,
    });
  }

  /** GET /api/v1/form-template/{id}/versions — 版本历史 */
  async listTemplateVersions(templateId: number): Promise<ApiResponse<TemplateVersion[]>> {
    return this.request<TemplateVersion[]>(`/form-template/${templateId}/versions`, {
      method: 'GET',
    });
  }

  /** GET /api/v1/form-template/search — 搜索模板 */
  async searchTemplates(params: SearchTemplatesParams = {}): Promise<ApiResponse<PaginatedData<FormTemplate>>> {
    return this.request<PaginatedData<FormTemplate>>('/form-template/search', {
      method: 'GET',
      params: {
        current: params.current ?? 1,
        pageSize: params.pageSize ?? 20,
        categoryId: params.categoryId,
        name: params.name,
      },
    });
  }

  /**
   * POST /api/v1/form-template — 新建模板
   * 新建后自动创建 version=1, status=1 (草稿) 的版本记录。
   * 响应返回 data.id（templateId），不含 versionId。
   */
  async createTemplate(req: CreateTemplateRequest): Promise<ApiResponse<Partial<FormTemplate>>> {
    return this.request<Partial<FormTemplate>>('/form-template', {
      method: 'POST',
      body: {
        name: req.sampleName,
        categoryId: req.categoryId,
        testingItemName: req.testingItemName,
        controlledNumber: req.controlledNumber ?? '',
        spec: req.standard ?? '',
        outputValue: req.outputValue ?? '',
      },
    });
  }

  /**
   * PATCH /api/v1/form-template-version/{versionId} — 保存模板版本（核心 API）
   * 一次性提交全部数据（extra + formTemplateJson + tableTemplateJson）。
   */
  async saveTemplateVersion(
    versionId: number,
    req: SaveTemplateVersionRequest
  ): Promise<ApiResponse<TemplateVersion>> {
    return this.request<TemplateVersion>(`/form-template-version/${versionId}`, {
      method: 'PATCH',
      body: req,
    });
  }

  /**
   * PATCH /api/v1/form-template-version/{versionId} — 设置受控编号
   * 需全局唯一，格式：JC/DJL XX-***-年份-A
   */
  async setControlledNo(versionId: number, controlledNo: string): Promise<ApiResponse<TemplateVersion>> {
    return this.request<TemplateVersion>(`/form-template-version/${versionId}`, {
      method: 'PATCH',
      body: { controlledNo },
    });
  }

  /**
   * POST /api/v1/form-template/{id}/change — 发起变更
   * 前置条件：模板 status=2（已启用）。
   * 响应直接返回新版本对象（含 id），无需再调 getTemplateDetail。
   */
  async initiateChange(templateId: number): Promise<ApiResponse<TemplateVersion>> {
    return this.request<TemplateVersion>(`/form-template/${templateId}/change`, {
      method: 'POST',
      body: {},
    });
  }

  /**
   * POST /api/v1/form-template-version/{versionId}/activate — 启用模板版本
   * 前置条件：必须先通过 setControlledNo() 设置受控编号。
   */
  async activateTemplate(versionId: number): Promise<ApiResponse<TemplateVersion>> {
    return this.request<TemplateVersion>(`/form-template-version/${versionId}/activate`, {
      method: 'POST',
      body: {},
    });
  }

  /**
   * DELETE /api/v1/form-template/{id} — 删除模板
   */
  async deleteTemplate(templateId: number): Promise<{ success: boolean; deletedId: number | null }> {
    const res = await this.request<{ id: number; deletedAt: string }>(
      `/form-template/${templateId}`,
      { method: 'DELETE' }
    );
    return { success: res.success, deletedId: res.data?.id ?? null };
  }

  // ----------------------------------------------------------
  // 7.6 提交日志 API
  // ----------------------------------------------------------

  /** GET /api/v1/mobile/submission-logs — 提交日志 */
  async listSubmissionLogs(
    params: PaginationParams = {}
  ): Promise<ApiResponse<PaginatedData<SubmissionLog>>> {
    return this.request<PaginatedData<SubmissionLog>>('/mobile/submission-logs', {
      method: 'GET',
      params: {
        current: params.current ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    });
  }

  // ----------------------------------------------------------
  // 7.7 预览 API
  // ----------------------------------------------------------

  /**
   * POST /api/v1/template-preview/session — 创建预览会话
   * body: { templateId, versionId } → { token, expiredAt }
   */
  async createPreviewSession(
    templateId: number,
    versionId: number
  ): Promise<ApiResponse<PreviewSession>> {
    return this.request<PreviewSession>('/template-preview/session', {
      method: 'POST',
      body: { templateId, versionId },
    });
  }

  // ----------------------------------------------------------
  // 7.8 便捷查询方法
  // ----------------------------------------------------------

  /** 获取可编辑的版本 ID（draftVersion 或 currentVersion） */
  getEditableVersionId(template: FormTemplate): number | null {
    if (template.draftVersion) return template.draftVersion.id;
    if (template.currentVersion) return template.currentVersion.id;
    return null;
  }

  /** 判断模板是否需要先发起变更（status=2 且 draftVersion=null） */
  needsInitiateChange(template: FormTemplate): boolean {
    return template.status === TemplateStatus.Active && template.draftVersion === null;
  }

  /** 判断模板是否已启用 */
  isActive(template: FormTemplate): boolean {
    return template.status === TemplateStatus.Active;
  }

  /** 判断模板是否有未发布的变更草稿 */
  hasDraftVersion(template: FormTemplate): boolean {
    return template.draftVersion !== null;
  }

  /** 生成下一个受控编号（原编号已被占用，追加或递增后缀） */
  nextControlledNo(currentNo: string): string {
    const match = currentNo.match(/-(\d+)$/);
    if (match) {
      return currentNo.replace(/-(\d+)$/, (_, n) => `-${Number(n) + 1}`);
    }
    return `${currentNo}-1`;
  }

  // ----------------------------------------------------------
  // 7.9 高级流程方法（5 个场景）
  // ----------------------------------------------------------

  /**
   * 场景1：创建并发布新模板（完整流程）
   *
   * login → createTemplate → getTemplateDetail → 构建Schema/extra/table
   * → saveTemplateVersion → setControlledNo → activateTemplate
   */
  async createAndPublishTemplate(params: {
    sampleName: string;
    categoryId: number;
    testingItemName: string;
    standard?: string;
    formSchema: FormilySchema;
    extra: ExtraConfig;
    tableTemplate: TableTemplateJson;
    controlledNo: string;
    login?: LoginRequest;
  }): Promise<{ templateId: number; versionId: number }> {
    if (params.login) {
      await this.login(params.login);
    }
    await this.ensureToken();

    const createRes = await this.createTemplate({
      sampleName: params.sampleName,
      categoryId: params.categoryId,
      testingItemName: params.testingItemName,
      standard: params.standard,
    });
    const templateId = createRes.data.id!;

    const detailRes = await this.getTemplateDetail(templateId);
    const versionId = this.getEditableVersionId(detailRes.data);
    if (!versionId) throw new Error('新建模板后未找到可编辑版本');

    await this.saveTemplateVersion(versionId, {
      extra: params.extra,
      formTemplateJson: params.formSchema,
      tableTemplateJson: params.tableTemplate,
    });

    await this.setControlledNo(versionId, params.controlledNo);
    await this.activateTemplate(versionId);

    return { templateId, versionId };
  }

  /**
   * 场景2：修改已有模板（含状态机分支）
   *
   * 自动判断模板状态 A/B/C，按需发起变更，保存后按需重新发布。
   */
  async modifyTemplate(templateId: number, modifications: {
    formSchema?: FormilySchema;
    extra?: ExtraConfig;
    tableTemplate?: TableTemplateJson;
  }): Promise<{ versionId: number; republished: boolean }> {
    const detailRes = await this.getTemplateDetail(templateId);
    const template = detailRes.data;

    let versionId: number;
    if (this.needsInitiateChange(template)) {
      const changeRes = await this.initiateChange(templateId);
      versionId = changeRes.data.id;
    } else {
      versionId = this.getEditableVersionId(template)!;
    }

    const sourceVersion = template.draftVersion ?? template.currentVersion!;
    const mergedSchema = modifications.formSchema ?? sourceVersion.formTemplateJson!;
    const mergedExtra = modifications.extra ?? sourceVersion.extra!;
    const mergedTable = modifications.tableTemplate ?? sourceVersion.tableTemplateJson!;

    await this.saveTemplateVersion(versionId, {
      extra: mergedExtra,
      formTemplateJson: mergedSchema,
      tableTemplateJson: mergedTable,
    });

    if (this.isActive(template)) {
      const newNo = this.nextControlledNo(template.controlledNo);
      await this.setControlledNo(versionId, newNo);
      await this.activateTemplate(versionId);
      return { versionId, republished: true };
    }

    return { versionId, republished: false };
  }

  /**
   * 场景3：查询模板与提交日志（只读操作）
   */
  async queryOverview(params: {
    templatePageSize?: number;
    logPageSize?: number;
  } = {}): Promise<{
    templates: FormTemplate[];
    templateTotal: number;
    drafts: FormTemplate[];
    activeTemplates: FormTemplate[];
    withDraft: FormTemplate[];
    submissionLogs: SubmissionLog[];
    logTotal: number;
  }> {
    const [templatesRes, logsRes] = await Promise.all([
      this.listTemplates({ current: 1, pageSize: params.templatePageSize ?? 50 }),
      this.listSubmissionLogs({ current: 1, pageSize: params.logPageSize ?? 10 }),
    ]);

    const templates = templatesRes.data.list;
    return {
      templates,
      templateTotal: templatesRes.data.total,
      drafts: templates.filter((t) => t.status === TemplateStatus.Draft),
      activeTemplates: templates.filter((t) => t.status === TemplateStatus.Active && !t.draftVersion),
      withDraft: templates.filter((t) => t.status === TemplateStatus.Active && !!t.draftVersion),
      submissionLogs: logsRes.data.list,
      logTotal: logsRes.data.total,
    };
  }

  /**
   * 场景4：复制模板（基于已有模板创建新模板）
   */
  async copyTemplate(sourceId: number, newName?: string): Promise<{
    newTemplateId: number;
    newVersionId: number;
  }> {
    const sourceRes = await this.getTemplateDetail(sourceId);
    const source = sourceRes.data;

    const sourceVersion = source.draftVersion ?? source.currentVersion ?? source.activeVersion!;
    const sourceSchema = sourceVersion.formTemplateJson!;
    const sourceTable = sourceVersion.tableTemplateJson!;
    const sourceExtra = sourceVersion.extra!;

    const createRes = await this.createTemplate({
      sampleName: source.name,
      categoryId: source.categoryId,
      testingItemName: newName ?? `${source.testingItemName}（副本）`,
      standard: source.spec,
    });
    const newTemplateId = createRes.data.id!;

    const newDetailRes = await this.getTemplateDetail(newTemplateId);
    const newVersionId = newDetailRes.data.draftVersion!.id;

    await this.saveTemplateVersion(newVersionId, {
      extra: sourceExtra,
      formTemplateJson: sourceSchema,
      tableTemplateJson: sourceTable,
    });

    return { newTemplateId, newVersionId };
  }
}
