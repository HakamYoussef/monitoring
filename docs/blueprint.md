# **App Name**: ConfigDisplay

## Core Features:

- Configuration Input: Allow users to configure parameters (e.g., temperature, humidity) and display types (e.g., gauge chart).
- Configuration Storage: Store configurations as JSON in a non-persistent data storage or a simple JSON file to avoid using MongoDB for the MVP.
- Dynamic Display Generation: Dynamically generate the display page based on the stored configuration, rendering the specified gauges and other tools.
- Configuration Validation: Validate the configuration input to ensure that the parameters are correctly set before storing them.
- AI-Powered Configuration Suggestion Tool: Suggest optimal display configurations based on the chosen parameters using an AI reasoning tool. The tool will use characteristics of each parameter as well as general UI design best practices to offer its recommendations.

## Style Guidelines:

- Primary color: Soft blue (#77B5FE) to create a calm, technical, trustworthy impression.
- Background color: Light grey (#F0F4F8), close to white, creating a clean and modern feel.
- Accent color: Light orange (#FFC872), which is analogous to the primary color and distinct in brightness and saturation.
- Font: 'Inter', sans-serif, for both headings and body text.