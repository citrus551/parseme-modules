import { createInterface } from 'readline';

interface PromptOptions {
  message: string;
  defaultValue?: string;
  choices?: string[];
}

export async function prompt(options: PromptOptions): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const { message, defaultValue, choices } = options;

    let promptMessage = message;
    if (choices) {
      promptMessage += ` (${choices.join('/')})`;
    }
    if (defaultValue) {
      promptMessage += ` [${defaultValue}]`;
    }
    promptMessage += ': ';

    rl.question(promptMessage, (answer) => {
      rl.close();

      const trimmed = answer.trim();
      if (!trimmed && defaultValue) {
        resolve(defaultValue);
      } else if (choices && trimmed) {
        const normalized = trimmed.toLowerCase();
        const match = choices.find((choice) => choice.toLowerCase().startsWith(normalized));
        resolve(match || trimmed);
      } else {
        resolve(trimmed);
      }
    });
  });
}

export async function confirmPrompt(
  message: string,
  defaultValue: boolean = true,
): Promise<boolean> {
  const answer = await prompt({
    message,
    defaultValue: defaultValue ? 'y' : 'n',
    choices: ['y', 'n', 'yes', 'no'],
  });

  const normalized = answer.toLowerCase();
  return normalized === 'y' || normalized === 'yes';
}
