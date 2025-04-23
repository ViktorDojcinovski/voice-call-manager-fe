import FormRenderer from "../../../FormRenderer";
import { listFiltersSchema } from "../../../../schemas/create-list/schema_step_2";

const CreateList_step_2 = ({
  onNext,
  onPrevious,
}: {
  onNext: (data: any) => {};
  onPrevious: () => void;
}) => {
  return (
    <FormRenderer
      schema={listFiltersSchema}
      onNext={onNext}
      onPrevious={onPrevious}
    />
  );
};

export default CreateList_step_2;
