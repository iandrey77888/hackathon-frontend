// app/services/apiService.ts (обновленный)
import { BACK_URL } from "../contexts/GlobalContext";
import { ApiObjectDetails, PolygonPoint } from '../types';

export interface ApiObjectData {
  id: string;
  address?: string;
  status?: string;
  statusColor?: string;
  borderColor?: string;
  responsible?: string;
  stages?: { number: string; description: string }[];
  errorText?: string;
  isPlanned?: boolean;
  jobshiftPresent?: boolean;
  notesCount?: number;
  warnsCount?: number;
  activeJobs?: ActiveJob[];
  latitude?: number;
  longitude?: number;
  coordinates?: PolygonPoint[][][];
}

export interface ActiveJob {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export interface ObjectDetailsData extends ApiObjectDetails {}

export interface CreateViolationRequest {
  user_id: number;
  site_id: number;
  comment: string;
  fix_time: string;
  docs: string;
  file_ids: number[];
  geo: {
    accuracy: number;
    latitude: number;
    longitude: number;
  };
  stop_type: number;
  comm_type: number;
  witness: string;
  job_id: number;
}

export interface FixCommentRequest {
  comment_id: number;
  comment: string;
  geo: {
    accuracy: number;
    longitude: number;
    latitude: number;
  };
  file_ids: number[];
}

export interface ProcessCommentFixRequest {
  comment_fix_id: number;
  do_accept: boolean;
}

export interface ShipmentStartRequest {
  file: File | Blob;
  sitestage_id: number;
}

export interface OcrStatusRequest {
  shipment_id: number;
}

export interface MaterialsRequiredRequest {
  sitestage: number;
}

export interface ShipmentUpdateMaterial {
  seq: number;
  type_id: string;
  volume: number;
  serial: string;
  files: number[];
}

export interface ShipmentUpdateRequest {
  shipment_id: number;
  doc_serial: string;
  supplier_name: string;
  package_state: string;
  production_tech: string;
  materials: ShipmentUpdateMaterial[];
}


class ApiService {
  private baseURL = BACK_URL;

  async fixComment(token: string, fixData: FixCommentRequest): Promise<any> {
    try {
      console.log('=== ApiService.fixComment: Starting request ===');
      console.log('Endpoint:', `${this.baseURL}/buildsite/fixComment`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });
      console.log('Request body:', JSON.stringify(fixData, null, 2));

      const response = await fetch(`${this.baseURL}/buildsite/fixComment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fixData),
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Comment fixed successfully!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('=== ApiService.fixComment: Request completed ===');
      return data;
    } catch (error) {
      console.error('=== ApiService.fixComment: Request failed ===');
      console.error('Error type:', error instanceof Error ? error.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      console.error('=== End ApiService.fixComment error ===');
      throw error;
    }
  }

  async processCommentFix(token: string, processData: ProcessCommentFixRequest): Promise<any> {
    try {
      console.log('=== ApiService.processCommentFix: Starting request ===');
      console.log('Endpoint:', `${this.baseURL}/buildsite/processCommentFix`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });
      console.log('Request body:', JSON.stringify(processData, null, 2));
      console.log('Action:', processData.do_accept ? 'ACCEPTING' : 'REJECTING');

      const response = await fetch(`${this.baseURL}/buildsite/processCommentFix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(processData),
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Comment fix processed successfully!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('=== ApiService.processCommentFix: Request completed ===');
      return data;
    } catch (error) {
      console.error('=== ApiService.processCommentFix: Request failed ===');
      console.error('Error type:', error instanceof Error ? error.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      console.error('=== End ApiService.processCommentFix error ===');
      throw error;
    }
  }

   async createViolation(token: string, violationData: CreateViolationRequest): Promise<any> {
    try {
      console.log('Sending violation data to API:', violationData);

      const response = await fetch(`${this.baseURL}/buildsite/createComment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(violationData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        // Попытаемся получить текст ошибки от сервера
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Violation created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating violation:', error);
      throw error;
    }
  }

  async getAvailableObjects(token: string, page: number = 1, per_page: number = 10): Promise<ApiObjectData[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/buildsite/getAvailableObjects?page=${page}&per_page=${per_page}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      return this.transformApiData(data);
    } catch (error) {
      console.error('Error fetching objects:', error);
      throw error;
    }
  }

    async getObjectDetails(token: string, objectId: string, details: boolean = true): Promise<ObjectDetailsData> {
    try {
      const response = await fetch(
        `${this.baseURL}/buildsite/getObjectData?id=${objectId}&details=${details}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Object details API Response:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching object details:', error);
      throw error;
    }
  }

  private transformApiData(apiData: any): ApiObjectData[] {
    console.log('Transforming API data:', apiData);
    
    if (apiData.items && Array.isArray(apiData.items)) {
      return apiData.items.map((item: any) => this.transformObject(item));
    }
    
    if (Array.isArray(apiData)) {
      return apiData.map(item => this.transformObject(item));
    }
    
    if (apiData.data && Array.isArray(apiData.data)) {
      return apiData.data.map((item: any) => this.transformObject(item));
    }
    
    console.warn('Unknown API response format:', apiData);
    return [];
  }

  private transformObject(apiObject: any): ApiObjectData {
    const stateMapping: { [key: number]: { status: string; color: string } } = {
      [-1]: { status: 'Остановлен', color: '#F44336' },
      [0]: { status: 'Планирование', color: '#FFC107' },
      [1]: { status: 'В работе', color: '#4CAF50' }
    };

    const stateInfo = stateMapping[apiObject.state] || { status: 'Неизвестно', color: '#757575' };

    // Логируем координаты для отладки
    if (apiObject.coordinates) {
      console.log('RAW coordinates from backend for object:', apiObject.sitename);
      console.log('Coordinates structure:', {
        length: apiObject.coordinates.length,
        firstPolygon: apiObject.coordinates[0]?.length,
        firstRing: apiObject.coordinates[0]?.[0]?.length,
        samplePoint: apiObject.coordinates[0]?.[0]?.[0]
      });
    }

    return {
      id: apiObject.id?.toString() || 'Не пришло из запроса',
      address: apiObject.sitename || 'Не пришло из запроса',
      status: stateInfo.status,
      statusColor: stateInfo.color,
      borderColor: stateInfo.color,
      responsible: this.getResponsibleText(apiObject.foreman_name, apiObject.manager_name),
      stages: this.transformActiveJobs(apiObject.active_jobs),
      errorText: apiObject.error_message || apiObject.errorText,
      isPlanned: apiObject.state === 0,
      jobshiftPresent: apiObject.jobshift_present || false,
      notesCount: apiObject.notes_count || 0,
      warnsCount: apiObject.warns_count || 0,
      activeJobs: this.transformActiveJobsData(apiObject.active_jobs),
      latitude: apiObject.geo_data?.latitude,
      longitude: apiObject.geo_data?.longitude,
      coordinates: apiObject.coordinates
    };
  }

  private getResponsibleText(foremanName: string, managerName: string): string {
    if (foremanName) {
      return `Ответственный: ${foremanName}`;
    }
    if (managerName) {
      return `Ответственный: ${managerName}`;
    }
    return 'Ответственный: Не пришло из запроса';
  }

  private transformActiveJobs(activeJobs: any[]): { number: string; description: string }[] {
    if (!activeJobs || !Array.isArray(activeJobs) || activeJobs.length === 0) {
      return [{ number: '1', description: 'Нет активных работ' }];
    }

    return activeJobs.map((job) => {
      // Форматируем номер этапа в формате "stage_seq.seq" (4.1)
      const stageNumber = job.stage_seq && job.seq 
        ? `${job.stage_seq}.${job.seq}`
        : (job.seq || job.stage_seq || '1').toString();
      
      return {
        number: stageNumber,
        description: job.name || job.title || job.description || `Работа ${stageNumber}`
      };
    });
  }

  private transformActiveJobsData(activeJobs: any[]): ActiveJob[] {
    if (!activeJobs || !Array.isArray(activeJobs)) {
      return [];
    }

    console.log('=== transformActiveJobsData: RAW active_jobs from API ===');
    console.log('Number of jobs:', activeJobs.length);
    activeJobs.forEach((job, index) => {
      console.log(`Job ${index}:`, JSON.stringify(job, null, 2));
      console.log(`  - id: ${job.id} (type: ${typeof job.id})`);
      console.log(`  - name: ${job.name}`);
      console.log(`  - stage_id: ${job.stage_id}`);
    });

    return activeJobs.map((job, index) => {
      // ВАЖНО: используем job.id напрямую как число для sitestage_id
      const jobId = typeof job.id === 'number' ? job.id : (parseInt(job.id) || index);
      console.log(`Transforming job ${index}: original id = ${job.id}, transformed id = ${jobId}`);

      return {
        id: jobId.toString(), // Преобразуем в строку только для интерфейса ActiveJob
        name: job.name || job.title || `Работа ${index + 1}`,
        description: job.description,
        status: job.status
      };
    });
  }

  // Методы для работы с поставками и OCR
  async shipmentStart(token: string, file: any, sitestageId: number): Promise<{ shipment_id: number }> {
    try {
      console.log('=== ApiService.shipmentStart: Starting request ===');
      console.log('Endpoint:', `${this.baseURL}/shipment/start`);
      console.log('sitestage:', sitestageId);
      console.log('File info:', { uri: file.uri, type: file.type, name: file.name });

      // Создаем FormData для multipart/form-data
      const formData = new FormData();

      // Добавляем sitestage_id как обычное поле
      formData.append('sitestage', sitestageId.toString());

      // Для React Native файл передается как объект с полями uri, type, name
      // @ts-ignore - React Native FormData поддерживает такой формат
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'ttn_photo.jpg',
      });

      console.log('FormData prepared with fields:', {
        sitestage_id: sitestageId,
        file: { uri: file.uri, type: file.type || 'image/jpeg', name: file.name || 'ttn_photo.jpg' }
      });

      const response = await fetch(`${this.baseURL}/shipment/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // ВАЖНО: НЕ указываем Content-Type вручную!
          // FormData автоматически установит 'multipart/form-data' с правильным boundary
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Shipment started successfully!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('=== ApiService.shipmentStart: Request completed ===');
      return data;
    } catch (error) {
      console.error('=== ApiService.shipmentStart: Request failed ===');
      console.error('Error:', error);
      console.error('=== End ApiService.shipmentStart error ===');
      throw error;
    }
  }

  async getOcrStatus(token: string, shipmentId: number): Promise<any> {
    try {
      console.log('=== ApiService.getOcrStatus: Checking OCR status ===');
      console.log('shipment_id:', shipmentId);

      // Используем query параметр
      const url = `${this.baseURL}/shipment/ocr/status?shipment_id=${shipmentId}`;
      console.log('Full URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('OCR status response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('=== ApiService.getOcrStatus: Request failed ===');
      console.error('Error:', error);
      throw error;
    }
  }

  async getMaterialsRequired(token: string, sitestage: number): Promise<any[]> {
    try {
      console.log('=== ApiService.getMaterialsRequired: Starting request ===');
      console.log('sitestage:', sitestage);

      // Используем query параметр
      const url = `${this.baseURL}/shipment/materials/required?sitestage=${sitestage}`;
      console.log('Full URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Materials required response:', JSON.stringify(data, null, 2));
      console.log('=== ApiService.getMaterialsRequired: Request completed ===');
      return data;
    } catch (error) {
      console.error('=== ApiService.getMaterialsRequired: Request failed ===');
      console.error('Error:', error);
      throw error;
    }
  }

  async shipmentUpdate(token: string, shipmentData: ShipmentUpdateRequest): Promise<any> {
    try {
      console.log('=== ApiService.shipmentUpdate: Starting request ===');
      console.log('Endpoint:', `${this.baseURL}/shipment/update`);
      console.log('Shipment data:', JSON.stringify(shipmentData, null, 2));

      const response = await fetch(`${this.baseURL}/shipment/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shipmentData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (parseError) {
          console.error('Could not read error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Shipment updated successfully!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('=== ApiService.shipmentUpdate: Request completed ===');
      return data;
    } catch (error) {
      console.error('=== ApiService.shipmentUpdate: Request failed ===');
      console.error('Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();