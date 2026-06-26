import { API_HOST, APP_VERSION } from '@/config/constants';
// import { MatrixDatabaseService } from "@/services/matrix/storage/DatabaseService";
import JobService from "@/services/jobs/JobService";
// import SearchService from "@/services/search/SearchService";
import JobTemplateService from "@/services/jobs/JobTemplateService";
// import ChatService from "@/services/chat/ChatService";
// import ContactsService from "@/services/contacts/ContactsService";
// import ProfileService from "@/services/contacts/ProfileService";
// import GroupsService from "@/services/groups/GroupsService";

type AppConfigType = {
  name: string;
  description: string;
  version: string;
  chatSetup: {
    baseUrl: string;
    authToken: string | undefined;
  };
}

export const config: AppConfigType = {
  name: 'Medneeds',
  description: 'Sua agenda médica em um só lugar',
  version: APP_VERSION || '0.0.1',
  // Configuração do SDK de chat
  chatSetup: {
    baseUrl: API_HOST || 'http://localhost:3000',
    authToken: undefined
  }
} as const; 


// export const matrixDatabaseService = new MatrixDatabaseService();
export const jobService = new JobService();
export const templateService = new JobTemplateService();
// export const searchService = new SearchService();
// export const chatService = new ChatService();
// export const contactsService = new ContactsService();
// export const profileService = new ProfileService();
// export const groupsService = new GroupsService();