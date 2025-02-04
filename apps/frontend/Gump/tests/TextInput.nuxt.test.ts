import { beforeEach, describe, expect, it } from 'vitest'
import { type VueWrapper, mount } from '@vue/test-utils'
import type { ComponentPublicInstance } from 'vue'
import TextInput from '~/components/TextInput.vue'

type ITextInputProps = {
  text: string
  type?: 'email' | 'password' | 'number'
}

describe('TextInput', () => {
  let wrapper: VueWrapper<ComponentPublicInstance<ITextInputProps>>

  beforeEach(() => {
    wrapper = mount(TextInput, {
      props: {
        text: 'Hello',
        type: 'email',
      },
    })
  })

  it('should render the text prop', () => {
    const input = wrapper.find('input')
    expect(input.element.value).toBe('Hello')
  })

  it('should render the type prop', () => {
    const input = wrapper.find('input')
    expect(input.element.type).toBe('email')
  })

  it('should emit update:text event when input changes', async () => {
    const input = wrapper.find('input')
    await input.setValue('World')
    expect(wrapper.emitted()).toHaveProperty('update:text')
    expect(wrapper.emitted('update:text')![0][0]).toBe('World')
  })
})
