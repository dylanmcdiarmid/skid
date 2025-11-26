import QUnit from "qunit";

const { module, test } = QUnit;

import { render } from "@tests/test-utils";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";

// Test component that uses the form
function TestFormComponent() {
  const form = useForm({
    defaultValues: {
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

module("Component | Form", () => {
  test("renders form with field registration", (assert) => {
    const { getByText, getByPlaceholderText } = render(<TestFormComponent />);

    assert.dom(getByText("Email")).exists();
    assert.dom(getByPlaceholderText("Enter email")).exists();
    assert.dom(getByText("Submit")).exists();
  });
});
