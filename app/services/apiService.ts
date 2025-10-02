// app/services/apiService.ts (обновленный)
import { ApiObjectDetails } from '../types';

import { BACK_URL } from "../contexts/GlobalContext";

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
  geo: {
    accuracy: number;
    latitude: number;
    longitude: number;
  };
  stop_type: number;
  comm_type: number;
  witness: string;
  //job_id: number;
}


class ApiService {
  private baseURL = BACK_URL;

   async createViolation(token: string, violationData: CreateViolationRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/buildsite/createComment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(violationData),
      });
      console.log('Violation data:', violationData);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
      longitude: apiObject.geo_data?.longitude
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

    return activeJobs.map((job, index) => ({
      id: job.id?.toString() || `job-${index}`,
      name: job.name || job.title || `Работа ${index + 1}`,
      description: job.description,
      status: job.status
    }));
  }
}

export const apiService = new ApiService();