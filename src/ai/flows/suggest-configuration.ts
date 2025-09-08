'use server';

/**
 * @fileOverview AI-powered configuration suggestion flow.
 *
 * This file defines a Genkit flow that suggests optimal display configurations based on user-selected parameters.
 * - suggestConfiguration -  A function that suggests an initial display configuration.
 * - SuggestConfigurationInput - The input type for the suggestConfiguration function.
 * - SuggestConfigurationOutput - The return type for the suggestConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestConfigurationInputSchema = z.object({
  parameters: z
    .array(
      z.object({
        name: z.string().describe('The name of the parameter (e.g., temperature, humidity).'),
        unit: z.string().optional().describe('The unit of measurement for the parameter (e.g., °C, %).'),
        description: z.string().optional().describe('A detailed description of the parameter.'),
      })
    )
    .describe('The list of parameters selected by the user.'),
});
export type SuggestConfigurationInput = z.infer<typeof SuggestConfigurationInputSchema>;

const SuggestConfigurationOutputSchema = z.object({
  configuration: z
    .object({
      displayType: z.string().describe('The suggested display type (e.g., gauge chart, line graph).'),
      options: z.record(z.any()).optional().describe('Additional display options for the suggested display type.'),
    })
    .array()
    .describe('The suggested display configuration for each parameter.'),
});
export type SuggestConfigurationOutput = z.infer<typeof SuggestConfigurationOutputSchema>;

export async function suggestConfiguration(input: SuggestConfigurationInput): Promise<SuggestConfigurationOutput> {
  return suggestConfigurationFlow(input);
}

const suggestConfigurationPrompt = ai.definePrompt({
  name: 'suggestConfigurationPrompt',
  input: {schema: SuggestConfigurationInputSchema},
  output: {schema: SuggestConfigurationOutputSchema},
  prompt: `You are an AI assistant that suggests optimal display configurations for a web application based on the selected parameters.

  Consider the characteristics of each parameter (name, unit, description) and general UI design best practices to offer your recommendations.

  For each parameter, suggest a suitable display type (e.g., gauge chart, line graph) and any relevant display options.

  Parameters:
  {{#each parameters}}
  - Name: {{name}}
    Unit: {{unit}}
    Description: {{description}}
  {{/each}}`,
});

const suggestConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestConfigurationFlow',
    inputSchema: SuggestConfigurationInputSchema,
    outputSchema: SuggestConfigurationOutputSchema,
  },
  async input => {
    const {output} = await suggestConfigurationPrompt(input);
    return output!;
  }
);
