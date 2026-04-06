import PowerDialerManagementFormComponent from "../components/forms/PowerDialerManagementFormComponent";
import CallManagementFormComponent from "../components/forms/CallManagementFormComponent";
import CallResultsComponent from "../components/forms/CallResultsComponent";
import CallRecordingsFormComponent from "../components/forms/CallRecordingsFormComponent";
import CallSchedulesComponent from "../components/forms/CallSchedulesComponent";
import DataIntegrationComponent from "../components/forms/DataIntegrationComponent";
import EmailAccountFormComponent from "../components/forms/EmailAccountFormComponent";
import EmailSignatureFormComponent from "../components/forms/EmailSignatureFormComponent";
import EmailTemplatesListComponent from "../components/forms/EmailTemplatesListComponent";
import GeneralSettingsFormComponent from "../components/forms/GeneralSettingsFormComponent";
import CallStatusLogSettingsFormComponent from "../components/forms/CallStatusLogSettingsFormComponent";

export const settingsComponentRegistry: Record<
  string,
  Record<string, React.ComponentType<any>>
> = {
  "General Settings": {
    general: GeneralSettingsFormComponent,
  },
  "Phone Settings": {
    powerDialerManagement: PowerDialerManagementFormComponent,
    callManagement: CallManagementFormComponent,
    callResults: CallResultsComponent,
    recordingsManagement: CallRecordingsFormComponent,
    schedulesManagement: CallSchedulesComponent,
    integrationSettings: DataIntegrationComponent,
    callStatusLog: CallStatusLogSettingsFormComponent,
  },
  "Email Settings": {
    emailAccount: EmailAccountFormComponent,
    signature: EmailSignatureFormComponent,
    templates: EmailTemplatesListComponent,
  },
};
