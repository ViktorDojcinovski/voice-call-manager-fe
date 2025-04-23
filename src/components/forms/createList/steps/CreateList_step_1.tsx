import FormRenderer from "../../../FormRenderer";
import { listSettingsSchema } from "../../../../schemas/create-list/schema_step_1";

const CreateList_step_1 = ({ onNext }: { onNext: (data: any) => void }) => {
  return <FormRenderer schema={listSettingsSchema} onNext={onNext} />;
};

export default CreateList_step_1;
