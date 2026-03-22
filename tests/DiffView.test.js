import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DiffView from '../src/components/DiffView.vue'

function findButton(wrapper, label) {
  return wrapper.findAll('button').find(button => button.text().includes(label))
}

describe('DiffView', () => {
  it('emits the owning bubble when hunk decisions change', async () => {
    const bubble = { id: 'bubble-1' }
    const hunks = [{ type: 'change', removed: 'old\n', added: 'new\n', accepted: null }]

    const wrapper = mount(DiffView, {
      props: {
        bubble,
        hunks,
      },
    })

    await findButton(wrapper, 'Accept').trigger('click')
    await findButton(wrapper, 'undo').trigger('click')
    await findButton(wrapper, 'Reject').trigger('click')

    expect(hunks[0].accepted).toBe(false)
    expect(wrapper.emitted('change')).toEqual([[bubble], [bubble], [bubble]])
  })
})
