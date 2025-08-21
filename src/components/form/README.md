# Form Components Refactoring

This directory contains reusable form components that were extracted from the `LoginView.vue` to improve maintainability, reusability, and code clarity.

## Component Structure

```
components/form/
├── BaseForm.vue              # Generic form wrapper
├── LoginForm.vue             # Login-specific form component
├── ErrorMessage.vue          # Error display component
├── fields/
│   ├── BaseField.vue         # Reusable base input field
│   ├── UserField.vue         # Email input field
│   └── PasswordField.vue     # Password input with toggle
├── buttons/
│   ├── BaseButton.vue        # Generic button component
│   └── SubmitButton.vue      # Submit button with loading state
└── index.ts                  # Export file for easy imports
```

## Components Overview

### BaseForm.vue
- Generic form wrapper that emits submit events
- Handles form submission prevention
- Provides consistent spacing and layout

### LoginForm.vue
- Composes all form elements for login functionality
- Handles login-specific logic and validation
- Emits events for form submission and demo credentials

### BaseField.vue
- Reusable input field with label and error handling
- Supports various input types and validation states
- Includes focus/blur event handling

### UserField.vue
- Specialized email input field
- Extends BaseField with email-specific attributes
- Includes proper autocomplete and validation

### PasswordField.vue
- Password input with show/hide toggle
- Uses EyeIcon and EyeSlashIcon for toggle
- Maintains security best practices

### BaseButton.vue
- Generic button with multiple variants and sizes
- Supports primary, secondary, danger, and ghost styles
- Includes loading and disabled states

### SubmitButton.vue
- Submit-specific button with loading spinner
- Extends BaseButton for form submissions
- Shows loading text during submission

### ErrorMessage.vue
- Displays validation or API errors
- Uses consistent error styling
- Includes error icon for better UX

## Usage Example

```vue
<template>
  <LoginForm
    :is-loading="isLoading"
    :login-error="loginError"
    :is-development="isDevelopment"
    @submit="handleLogin"
    @fill-demo-credentials="fillDemoCredentials"
  />
</template>

<script setup>
import { LoginForm } from '@components/form'

const handleLogin = (formData) => {
  // Handle login logic
  console.log(formData)
}

const fillDemoCredentials = () => {
  // Fill demo credentials
}
</script>
```

## Benefits

1. **Reusability**: Components can be used across different forms (signup, reset password, etc.)
2. **Maintainability**: Logic is separated and easier to maintain
3. **Testability**: Each component can be tested independently
4. **Consistency**: Ensures consistent styling and behavior across forms
5. **Scalability**: Easy to add new form components following the same pattern

## Migration Notes

The original `LoginView.vue` has been refactored to use these new components. The functionality remains the same, but the code is now more modular and maintainable.

## Testing

Tests are included in `__tests__/LoginForm.test.ts` to verify the components work correctly. 