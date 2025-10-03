/**
 * Aroma Tech API Service
 * Complete integration with the Django REST API backend
 */

const API_BASE_URL = import.meta.env.DEV 
  ? '/api/v1'  // Use proxy in development
  : 'https://aroma.avagtpl.com/api/v1';  // Direct URL in production

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface LoginRequest {
  aroma_account: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface UserProfile {
  id: string;
  createDate: string;
  phone: string;
  username: string;
  account: string;
  password: string;
  email: string;
  supplierId: string | null;
  groupId: string | null;
  brandId: string | null;
  storeId: string | null;
  deleted: number;
  status: number;
}

export interface DeviceCreateRequest {
  sn: string; // Required - Device serial number (must be pre-registered)
  name?: string; // Optional - Device display name (defaults to "Device {sn}")
  deviceTypeId?: string; // Optional - Device type identifier (defaults to standard type)
  address?: string; // Optional - Full street address (defaults to "Default Address")
  city?: string; // Optional - City name (defaults to "Default City")
  province?: string; // Optional - Province/state name (defaults to "Default Province")
  lat?: string; // Optional - Latitude coordinate (defaults to Delhi coordinates)
  lng?: string; // Optional - Longitude coordinate (defaults to Delhi coordinates)
}

export interface Device {
  id: string;
  name: string;
  sn: string;
  status: 'ONLINE' | 'OFFLINE';
  deviceTypeId?: string;
  oilName?: string;
  customerId?: string;
  subCustomerId?: string | null;
  supplierId?: string | null;
  groupId?: string | null;
  brandId?: string | null;
  storeId?: string | null;
  iccid?: string | null;
  iccidExtInfo?: string | null;
  iccidExpireTime?: string | null;
  binVersion?: string;
  remainInfoTotal?: number;
  remainInfoCurrent?: number;
  remainInfoDay?: number;
  deviceGroupId?: string;
  deviceSubGroupId?: string;
  iotId?: string;
  iotProjectId?: string;
  iotBesideMqttAddr?: string;
  iotBesideMqttClientId?: string;
  iotBesideMqttPassword?: string;
  iotBesideMqttTopic?: string;
  iotBesideMqttUsername?: string;
  iotBesideWsAddr?: string;
  iotBesideWssAddr?: string;
  imageUrl?: string;
  subDeviceTypeId?: string | null;
  peerHost?: string;
  province?: string;
  city?: string;
  address?: string;
  lat?: string;
  lng?: string;
  peerProvince?: string;
  peerCity?: string;
  note?: string | null;
  deleted?: number;
  showLocation?: number;
  createDate?: string;
  onlineTime?: number;
  offlineTime?: number;
  // Legacy properties for backward compatibility
  deviceId?: string;
  type?: string;
  lastSeen?: string;
  oilLevel?: number;
  fuelRate?: number;
  tankCapacity?: number;
  location?: string;
}

export interface DeviceListResponse {
  records: Device[];
  total: number;
  size: number;
  current: number;
  orders: any[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  countId: string | null;
  maxLimit: number | null;
  pages: number;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  parentGroupId: string;
  deviceIds: string[];
}

export interface EmailCodeRequest {
  email: string;
  type: number; // 1 = Registration, 0 = Password Reset
}

export interface SmsCodeRequest {
  phone: string;
  phoneMute: string;
  type: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  validCode: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
  phone: string;
  username: string;
  validCode: string;
}

export interface DeviceControlRequest {
  id: string;
  frame: string; // Hex string for device command
}

export interface BatchControlRequest {
  payload: Array<{
    deviceId: string;
    frame: string;
  }>;
}

export interface DeviceShareRequest {
  deviceId: string;
  targetAccount: string;
}

export interface DeviceGroupCreateRequest {
  name: string;
  description: string;
  parentGroupId: string;
  deviceIds: string[];
}

export interface DeviceGroupUpdateRequest {
  name: string;
  parentGroupId: string;
  deviceIds: string[];
  clean: boolean;
  id: string | null;
}

export interface DeviceGroupListResponse {
  records: DeviceGroup[];
  total: number;
  size: number;
  current: number;
  orders: any[];
}

export interface DeviceGroupListAllResponse {
  groups: DeviceGroupWithDevices[];
  total_groups: number;
  main_groups: number;
  sub_groups: number;
  devices_by_group: {
    main: Record<string, Device[]>;
    sub: Record<string, Device[]>;
  };
}

export interface DeviceGroupWithDevices {
  id: string;
  name: string;
  type: "main" | "sub";
  device_count: number;
  devices: Device[];
}

export interface FileUploadResponse {
  url: string;
  filename: string;
}

export interface ShareInfoResponse {
  sharedDevices: Device[];
  sharedGroups: DeviceGroup[];
  pendingShares: Array<{
    id: string;
    type: 'device' | 'group';
    sharedBy: string;
    sharedAt: string;
  }>;
}

export interface DeviceShareResponse {
  shareId: string;
  status: 'pending' | 'accepted' | 'refused';
}

export interface DeviceGroupShareRequest {
  groupId: string;
  targetAccount: string;
}

export interface ShareActionRequest {
  shareId: string;
}

export interface DeviceImageUpdateRequest {
  deviceId: string;
  imageUrl: string;
}

export interface DeviceChargeStatus {
  needsCharge: boolean;
  batteryLevel?: number;
  lastCharged?: string;
}

export interface SubAccount {
  customer: string | null;
  id: string;
  createDate: string;
  customerId: string;
  account: string;
  password: string;
  note: string;
  deleted: number;
  status: number;
  role: number;
}

export interface SubAccountCreateRequest {
  account: string;
  password: string;
  name: string;
  permissions?: string[];
}

export interface SubAccountUpdateRequest {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  name?: string;
}

export interface SubAccountDeviceShareRequest {
  subId: string;
  deviceId: string;
  rights: "VIEW" | "CONTROL";
}

export interface SubAccountDeviceCancelShareRequest {
  subId: string;
  deviceId: string;
}

export interface SubAccountGroupShareRequest {
  subAccountId: string;
  groupId: string;
}

export interface SharedDevice {
  id: string;
  name: string;
  deviceSN: string;
  deviceId: string;
  subAccount: string;
  rights: string;
  shareDate: string;
}

export interface SharedDevicesResponse {
  data: SharedDevice[];
  total: number;
}

export interface AvailableDevice {
  id: string;
  name: string;
  deviceSN: string;
  status: number;
  canShare: boolean;
}

export interface AvailableDevicesResponse {
  data: AvailableDevice[];
  total: number;
}

// Bulk Upload Interfaces
export interface BulkUploadStatus {
  bulk_upload_enabled: boolean;
  max_file_size_mb: number;
  supported_formats: string[];
  required_fields: string[];
  field_descriptions: Record<string, string>;
  sample_csv_url: string;
  validation_endpoint: string;
  upload_endpoint: string;
}

export interface BulkValidationResponse {
  valid: boolean;
  total_rows: number;
  errors: string[];
  warnings: string[];
}

export interface BulkUploadResult {
  row: number;
  status: "success" | "failed";
  device_data: {
    deviceName: string;
    deviceSN: string;
    deviceTypeId: string;
    address: string;
    city: string;
    province: string;
    lat: string;
    lng: string;
  };
  response?: {
    id: string;
    status: string;
  };
  error?: string;
}

export interface BulkUploadResponse {
  total: number;
  successful: number;
  failed: number;
  results: BulkUploadResult[];
  errors: BulkUploadResult[];
}

class AromaTechAPI {
  private baseURL: string;
  private token: string | null = null;
  private wsConnection: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private wsReconnectInterval = 5000; // 5 seconds
  private wsEventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('aroma_token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {    
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Aroma-Token'] = this.token;
    }

    // Log the API request
    console.log(`🚀 API Request: ${options.method || 'GET'} ${endpoint}`, {
      url,
      method: options.method || 'GET',
      headers: Object.fromEntries(Object.entries(headers).filter(([key]) => key !== 'Aroma-Token')),
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorResponse = {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        };
        
        // Log API error response
        console.error(`❌ API Error: ${options.method || 'GET'} ${endpoint}`, {
          status: response.status,
          statusText: response.statusText,
          error: errorResponse.error,
          response: errorData,
        });
        
        return errorResponse;
      }

      const data = await response.json();
      const successResponse = {
        success: true,
        data,
      };
      
      // Log API success response
      console.log(`✅ API Success: ${options.method || 'GET'} ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        response: data,
        responseSize: JSON.stringify(data).length,
      });
      
      return successResponse;
    } catch (error) {
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
      
      // Log API network error
      console.error(`🌐 API Network Error: ${options.method || 'GET'} ${endpoint}`, {
        error: errorResponse.error,
        originalError: error,
      });
      
      return errorResponse;
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log(`🔐 API: Login request`, { email: credentials.aroma_account });
    
    const result = await this.makeRequest<LoginResponse>('/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log(`📊 API: Login response`, {
      success: result.success,
      hasToken: !!result.data?.token,
      token: result.data?.token,
      error: result.error,
    });

    if (result.success && result.data) {
      this.token = result.data.token;
      localStorage.setItem('aroma_token', result.data.token);
      console.log(`✅ API: Token stored successfully`);
    }

    return result;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('aroma_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // User Management
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    console.log(`👤 API: Getting profile with token`, { 
      hasToken: !!this.token,
      token: this.token?.substring(0, 20) + '...' 
    });
    
    const result = await this.makeRequest<UserProfile>('/profile/');
    
    console.log(`📊 API: Profile response`, {
      success: result.success,
      username: result.data?.username,
      email: result.data?.email,
      id: result.data?.id,
      error: result.error,
    });
    
    return result;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>('/profile/', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async sendEmailCode(request: EmailCodeRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/email-code/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendSmsCode(request: SmsCodeRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/sms-code/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async register(request: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/register/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/reset-password/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Device Management
  async getDevices(page: number = 1, pageSize: number = 10): Promise<ApiResponse<DeviceListResponse>> {
    return this.makeRequest<DeviceListResponse>(`/device/list/?current=${page}&size=${pageSize}`);
  }

  async createDevice(device: Omit<Device, 'id'>): Promise<ApiResponse<Device>> {
    return this.makeRequest<Device>('/device/save/', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  async getDeviceDetails(deviceId: string): Promise<ApiResponse<Device>> {
    return this.makeRequest<Device>(`/device/detail/?id=${deviceId}`);
  }

  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<ApiResponse<Device>> {
    return this.makeRequest<Device>('/device/update/', {
      method: 'POST',
      body: JSON.stringify({ id: deviceId, ...updates }),
    });
  }

  async controlDevice(request: DeviceControlRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/control/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async batchControlDevices(request: BatchControlRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/control-batch/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deleteDevice(deviceId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/delete/', {
      method: 'POST',
      body: JSON.stringify({ id: deviceId }),
    });
  }

  async shareDevice(request: DeviceShareRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Device Group Management
  async createDeviceGroup(request: DeviceGroupCreateRequest): Promise<ApiResponse<DeviceGroup>> {
    return this.makeRequest<DeviceGroup>('/device-group/create/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDeviceGroups(page: number = 1, pageSize: number = 100): Promise<ApiResponse<DeviceGroupListResponse>> {
    return this.makeRequest<DeviceGroupListResponse>(`/device-group/list/?current=${page}&size=${pageSize}`);
  }

  async getDeviceGroupsAll(): Promise<ApiResponse<DeviceGroupListAllResponse>> {
    return this.makeRequest<DeviceGroupListAllResponse>('/device-group/list-all/');
  }

  async getDeviceGroupDetails(groupId: string): Promise<ApiResponse<DeviceGroup>> {
    return this.makeRequest<DeviceGroup>(`/device-group/detail/?id=${groupId}`);
  }

  async updateDeviceGroup(groupId: string, updates: DeviceGroupUpdateRequest): Promise<ApiResponse<DeviceGroup>> {
    // Remove id from updates to avoid duplication, use the groupId parameter
    const { id, ...updateData } = updates;
    const requestBody = { 
      id: groupId,
      name: updateData.name,
      parentGroupId: updateData.parentGroupId,
      deviceIds: updateData.deviceIds,
      clean: updateData.clean
    };
    console.log('🔧 updateDeviceGroup - Request body:', requestBody);
    
    return this.makeRequest<DeviceGroup>('/device-group/sub-upsert/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async deleteDeviceGroup(groupId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device-group/sub-delete/', {
      method: 'POST',
      body: JSON.stringify({ id: groupId }),
    });
  }

  // File Upload
  async uploadFile(file: File): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/file/upload/`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Aroma-Token'] = this.token;
    }

    // Log the file upload request
    console.log(`📤 File Upload Request: POST /file/upload/`, {
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      headers: Object.fromEntries(Object.entries(headers).filter(([key]) => key !== 'Aroma-Token')),
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorResponse = {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        };
        
        // Log file upload error
        console.error(`❌ File Upload Error: POST /file/upload/`, {
          status: response.status,
          statusText: response.statusText,
          error: errorResponse.error,
          response: errorData,
        });
        
        return errorResponse;
      }

      const data = await response.json();
      const successResponse = {
        success: true,
        data,
      };
      
      // Log file upload success
      console.log(`✅ File Upload Success: POST /file/upload/`, {
        status: response.status,
        statusText: response.statusText,
        response: data,
        fileName: file.name,
      });
      
      return successResponse;
    } catch (error) {
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      };
      
      // Log file upload network error
      console.error(`🌐 File Upload Network Error: POST /file/upload/`, {
        error: errorResponse.error,
        originalError: error,
        fileName: file.name,
      });
      
      return errorResponse;
    }
  }

  // Admin & Backup Management
  async getAdminPanel(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/admin/');
  }

  async deleteBackup(backupId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/delete-backup/', {
      method: 'POST',
      body: JSON.stringify({ id: backupId }),
    });
  }

  async getShareInfo(): Promise<ApiResponse<ShareInfoResponse>> {
    return this.makeRequest<ShareInfoResponse>('/share-info/');
  }

  // Device Group Share Management
  async shareDeviceGroup(request: DeviceGroupShareRequest): Promise<ApiResponse<DeviceShareResponse>> {
    return this.makeRequest<DeviceShareResponse>('/device-group/share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async acceptDeviceGroupShare(request: ShareActionRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device-group/accept-share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async refuseDeviceGroupShare(request: ShareActionRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device-group/refuse-share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async cancelDeviceGroupShare(request: ShareActionRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device-group/cancel-share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deleteSubDeviceGroup(groupId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device-group/sub-delete/', {
      method: 'POST',
      body: JSON.stringify({ id: groupId }),
    });
  }

  // Device Management Extensions
  /**
   * Create a new device using the /device/create/ endpoint
   * 
   * @param device - Device creation request with required sn and optional fields
   * @returns Promise<ApiResponse<Device>>
   * 
   * @example
   * ```typescript
   * const newDevice = await aromaAPI.createDeviceDirect({
   *   sn: "AR123456789",
   *   name: "Test Device",
   *   deviceTypeId: "037164fe160203b9a5e665612b2e7d1b",
   *   address: "123 Test Street",
   *   city: "Test City",
   *   province: "Test Province",
   *   lat: "28.511333",
   *   lng: "77.16705"
   * });
   * ```
   */
  async createDeviceDirect(device: DeviceCreateRequest): Promise<ApiResponse<Device>> {
    return this.makeRequest<Device>('/device/create/', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  async updateDeviceImage(request: DeviceImageUpdateRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/update-image/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async acceptDeviceShare(request: ShareActionRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/accept-share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async refuseDeviceShare(request: ShareActionRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/refuse-share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async cancelDeviceShare(request: ShareActionRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/cancel-share/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async checkDeviceChargeStatus(deviceId: string): Promise<ApiResponse<DeviceChargeStatus>> {
    return this.makeRequest<DeviceChargeStatus>(`/device/need-charge/?id=${deviceId}`);
  }

  async preChargeDevice(deviceId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/pre-charge/', {
      method: 'POST',
      body: JSON.stringify({ id: deviceId }),
    });
  }

  async resetDeviceConfig(deviceId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/device/reset-config/', {
      method: 'POST',
      body: JSON.stringify({ id: deviceId }),
    });
  }

  // Sub-Account Management
  async createSubAccount(request: SubAccountCreateRequest): Promise<ApiResponse<SubAccount>> {
    return this.makeRequest<SubAccount>('/sub/create/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getSubAccounts(): Promise<ApiResponse<SubAccount[] | { data: SubAccount[]; total: number }>> {
    return this.makeRequest<SubAccount[] | { data: SubAccount[]; total: number }>('/sub/list/');
  }

  async getSubAccountDetails(subAccountId: string): Promise<ApiResponse<SubAccount>> {
    return this.makeRequest<SubAccount>(`/sub/detail/?id=${subAccountId}`);
  }

  async updateSubAccount(subAccountId: string, updates: SubAccountUpdateRequest): Promise<ApiResponse<SubAccount>> {
    // Build request body with only provided fields
    const requestBody: any = { 
      id: subAccountId
    };
    
    // Only add fields that are provided and not empty
    if (updates.email) {
      requestBody.email = updates.email;
    }
    if (updates.username) {
      requestBody.username = updates.username;
    }
    if (updates.password) {
      requestBody.password = updates.password;
    }
    if (updates.phone) {
      requestBody.phone = updates.phone;
    }
    
    console.log('📤 Sub account update request body:', requestBody);
    console.log('📤 JSON stringified:', JSON.stringify(requestBody));
    
    // Try with JSON first as per the API specification
    return this.makeRequest<SubAccount>('/sub/update/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async enableSubAccount(subAccountId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/sub/enable/', {
      method: 'POST',
      body: JSON.stringify({ id: subAccountId }),
    });
  }

  async disableSubAccount(subAccountId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/sub/disable/', {
      method: 'POST',
      body: JSON.stringify({ id: subAccountId }),
    });
  }

  async deleteSubAccount(subAccountId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/sub/delete/', {
      method: 'POST',
      body: JSON.stringify({ id: subAccountId }),
    });
  }

  async getSubAccountSharedDevices(subAccountId: string): Promise<ApiResponse<SharedDevicesResponse>> {
    return this.makeRequest<SharedDevicesResponse>(`/sub/shared-devices/?id=${subAccountId}`);
  }

  async getSubAccountAvailableDevices(subAccountId: string): Promise<ApiResponse<Device[]>> {
    return this.makeRequest<Device[]>(`/sub/available-devices/?id=${subAccountId}`);
  }

  async getSharedDevices(subCustomerId?: string): Promise<ApiResponse<Device[]>> {
    const url = subCustomerId 
      ? `/sub/shared-devices/?sub_customer_id=${subCustomerId}`
      : '/sub/shared-devices/';
    return this.makeRequest<Device[]>(url);
  }

  async shareDeviceWithSubAccount(request: SubAccountDeviceShareRequest): Promise<{ ok: boolean }> {
    const response = await this.makeRequest<{ ok: boolean }>('/sub/share-device/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data || { ok: false };
  }

  async cancelDeviceShareWithSubAccount(request: SubAccountDeviceCancelShareRequest): Promise<{ ok: boolean }> {
    const response = await this.makeRequest<{ ok: boolean }>('/sub/cancel-share-device/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data || { ok: false };
  }

  // Bulk Upload APIs
  async getBulkUploadStatus(): Promise<ApiResponse<BulkUploadStatus>> {
    return this.makeRequest<BulkUploadStatus>('/bulk/status/');
  }

  async downloadBulkTemplate(): Promise<Blob> {
    const url = `${this.baseURL}/bulk/template/`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Aroma-Token'] = this.token;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    return response.blob();
  }

  async validateBulkUpload(csvFile: File): Promise<ApiResponse<BulkValidationResponse>> {
    const formData = new FormData();
    formData.append('csv_file', csvFile);

    try {
      const url = `${this.baseURL}/bulk/validate/`;
      const headers: HeadersInit = {};
      
      if (this.token) {
        headers['Aroma-Token'] = this.token;
      }

      console.log('🔍 validateBulkUpload - Uploading file:', {
        fileName: csvFile.name,
        fileSize: csvFile.size,
        fileType: csvFile.type,
        url
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('📊 validateBulkUpload - Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ validateBulkUpload - Error response:', data);
        return {
          success: false,
          error: data.error || data.detail || `HTTP ${response.status}: ${response.statusText}`,
          data: data as BulkValidationResponse,
        };
      }

      console.log('✅ validateBulkUpload - Success:', data);
      return {
        success: true,
        data: data as BulkValidationResponse,
      };
    } catch (error) {
      console.error('❌ validateBulkUpload - Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred during validation',
      };
    }
  }

  async uploadBulkDevices(csvFile: File): Promise<ApiResponse<BulkUploadResponse>> {
    const formData = new FormData();
    formData.append('csv_file', csvFile);

    try {
      const url = `${this.baseURL}/bulk/upload/`;
      const headers: HeadersInit = {};
      
      if (this.token) {
        headers['Aroma-Token'] = this.token;
      }

      console.log('🔍 uploadBulkDevices - Uploading file:', {
        fileName: csvFile.name,
        fileSize: csvFile.size,
        fileType: csvFile.type,
        url
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('📊 uploadBulkDevices - Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ uploadBulkDevices - Error response:', data);
        return {
          success: false,
          error: data.error || data.detail || `HTTP ${response.status}: ${response.statusText}`,
          data: data as BulkUploadResponse,
        };
      }

      console.log('✅ uploadBulkDevices - Success:', data);
      return {
        success: true,
        data: data as BulkUploadResponse,
      };
    } catch (error) {
      console.error('❌ uploadBulkDevices - Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred during upload',
      };
    }
  }

  async shareGroupWithSubAccount(request: SubAccountGroupShareRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/sub/share-group/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async cancelGroupShareWithSubAccount(request: SubAccountGroupShareRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/sub/cancel-share-group/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // WebSocket Real-time Updates
  connectWebSocket(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    try {
      // Use the MQTT WebSocket endpoint from device data
      const wsUrl = 'wss://8.138.115.86:8084/mqtt';
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('✅ WebSocket connected');
        this.wsReconnectAttempts = 0;
        this.emit('connected', {});
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 WebSocket message received:', data);
          this.emit('message', data);
          
          // Handle specific device updates
          if (data.type === 'device_update') {
            this.emit('device_update', data);
          } else if (data.type === 'device_status_change') {
            this.emit('device_status_change', data);
          }
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.wsConnection.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.attemptReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.attemptReconnect();
    }
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      console.log('🔌 Disconnecting WebSocket');
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  private attemptReconnect(): void {
    if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max WebSocket reconnection attempts reached');
      return;
    }

    this.wsReconnectAttempts++;
    console.log(`🔄 Attempting WebSocket reconnection ${this.wsReconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, this.wsReconnectInterval);
  }

  // Event listener management
  on(event: string, callback: (data: any) => void): void {
    if (!this.wsEventListeners.has(event)) {
      this.wsEventListeners.set(event, new Set());
    }
    this.wsEventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.wsEventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.wsEventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Real-time device status check
  async checkDeviceStatus(deviceId: string): Promise<ApiResponse<{ status: string; lastSeen: string }>> {
    return this.makeRequest<{ status: string; lastSeen: string }>(`/device/status/?id=${deviceId}`);
  }

  // Subscribe to device updates
  subscribeToDevice(deviceId: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe',
        deviceId: deviceId,
        token: this.token
      };
      this.wsConnection.send(JSON.stringify(message));
      console.log(`📡 Subscribed to device updates: ${deviceId}`);
    }
  }

  // Unsubscribe from device updates
  unsubscribeFromDevice(deviceId: string): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'unsubscribe',
        deviceId: deviceId,
        token: this.token
      };
      this.wsConnection.send(JSON.stringify(message));
      console.log(`📡 Unsubscribed from device updates: ${deviceId}`);
    }
  }
}

// Export singleton instance
export const aromaAPI = new AromaTechAPI();
export default aromaAPI;
