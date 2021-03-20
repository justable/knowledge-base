import { validate, addValidator, addMessage } from '@/shared/utils/validator';
import pattern from '@/shared/utils/regex';

async function run() {}
describe('测试validator', () => {
  const context = {
    name: '',
    age: '18',
    major: '',
  };

  it('默认支持required', () => {
    validate(
      context,
      [
        {
          fieldLabel: '姓名',
          fieldName: 'name',
          required: true,
        },
      ],
      () => {},
      err => {
        expect(err.length).toBe(1);
      },
    );
  });
});
