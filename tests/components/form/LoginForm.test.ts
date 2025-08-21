import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '@/components/form/LoginForm.vue'

describe('LoginForm', () => {
  it('renders correctly', () => {
    const wrapper = mount(LoginForm)
    
    // Check if form elements are rendered
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('emits submit event with form data', async () => {
    const wrapper = mount(LoginForm)
    
    // Fill in form data
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    
    // Submit form
    await wrapper.find('form').trigger('submit')
    
    // Check if submit event was emitted with correct data
    const submitEvents = wrapper.emitted('submit')
    expect(submitEvents).toBeTruthy()
    expect(submitEvents![0][0]).toEqual({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true
    })
  })

  it('emits fill-demo-credentials event', async () => {
    const wrapper = mount(LoginForm, {
      props: {
        isDevelopment: true
      }
    })
    
    // Find all buttons and click the one with demo credentials text
    const buttons = wrapper.findAll('button')
    const demoButton = buttons.find(button => button.text().includes('Fill demo credentials'))
    expect(demoButton).toBeTruthy()
    
    if (demoButton) {
      await demoButton.trigger('click')
      
      // Check if event was emitted
      const events = wrapper.emitted('fill-demo-credentials')
      expect(events).toBeTruthy()
    }
  })
}) 