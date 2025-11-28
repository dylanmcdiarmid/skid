import { typeboxResolver } from '@hookform/resolvers/typebox';
import { type Static, Type } from '@sinclair/typebox';
import { useForm } from 'react-hook-form';

import type { Generator } from '@/api/generators';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

const formSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  strategy: Type.Union([
    Type.Literal('weighted_random'),
    Type.Literal('random'),
    Type.Literal('least_recently_used'),
  ]),
  data_source: Type.Optional(Type.String()),
});

type GeneratorFormValues = Static<typeof formSchema>;

interface GeneratorFormProps {
  generator?: Generator;
  onSave: (data: GeneratorFormValues) => Promise<void>;
  onCancel: () => void;
}

export function GeneratorForm({
  generator,
  onSave,
  onCancel,
}: GeneratorFormProps) {
  const form = useForm<GeneratorFormValues>({
    resolver: typeboxResolver(formSchema),
    defaultValues: {
      name: generator?.name || '',
      strategy: generator?.strategy || 'random',
      data_source: generator?.data_source || '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: GeneratorFormValues) => {
    try {
      await onSave(values);
    } catch (error) {
      console.error('Failed to save generator:', error);
      form.setError('root', {
        message: 'Failed to save generator. Please try again.',
      });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="font-semibold text-xl tracking-tight">
          {generator ? 'Edit Generator' : 'New Generator'}
        </h2>
        <p className="text-muted-foreground">
          {generator
            ? 'Update the generator details below.'
            : 'Create a new generator to produce dynamic content.'}
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Major Scales" {...field} />
                </FormControl>
                <FormDescription>
                  A descriptive name for this generator.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <option value="random">Random</option>
                    <option value="weighted_random">Weighted Random</option>
                    <option value="least_recently_used">
                      Least Recently Used
                    </option>
                  </Select>
                </FormControl>
                <FormDescription>
                  How the value should be selected from the data source.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Source</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[150px] font-mono"
                    placeholder="Enter items, one per line..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The pool of items to generate from. Format depends on
                  strategy.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              disabled={isSubmitting}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {generator ? 'Update Generator' : 'Create Generator'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
