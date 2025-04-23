import FormRenderer from "../../../FormRenderer";
import { listExitStrategySchema } from "../../../../schemas/create-list/schema_step_3";

const CreateList_step_3 = ({
  onPrevious,
  onConfirm,
}: {
  onPrevious: () => void;
  onConfirm: (data: any) => {};
}) => {
  return (
    <FormRenderer
      schema={listExitStrategySchema}
      onPrevious={onPrevious}
      onSubmit={onConfirm}
    />
  );
};

export default CreateList_step_3;
