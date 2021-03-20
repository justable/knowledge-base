interface Strategies {
  [prop: string]: (value: any) => boolean;
}

interface ErrorMessages {
  [prop: string]: (value: string) => string;
}

interface DefaultRule {
  fieldLabel: string;
  fieldName: string;
  active: boolean;
  required: boolean;
}

interface Rule extends DefaultRule {
  [prop: string]: any;
}

const defaultStrategies: Strategies = {
  required(value) {
    return !!value;
  },
};

const defaultMessages: ErrorMessages = {
  required(fieldName) {
    return `${fieldName}不能为空`;
  },
};

let errorMessages: string[] = [];

function addStrategy(obj: Strategies) {
  Object.assign(defaultStrategies, obj);
}

function addMessages(obj: ErrorMessages) {
  Object.assign(defaultMessages, obj);
}

function validateOne(context: Record<string, any>, rule: Rule) {
  const strategyNames = Object.keys(defaultStrategies);
  strategyNames.forEach(name => {
    if (rule[name]) {
      const currentStrategy = defaultStrategies[name];
      const fieldValue = context[rule.fieldName];
      if (!currentStrategy(fieldValue)) {
        errorMessages.push(defaultMessages[name](rule.fieldLabel));
      }
    }
  });
}

function validate(
  context: Record<string, any>,
  rules: Rule[],
  success: () => void,
  fail: (msgs: string[]) => void,
) {
  const activedRules = rules.filter(rule => rule.active);
  activedRules.forEach(rule => {
    validateOne(context, rule);
  });
  if (errorMessages.length > 0) {
    fail(errorMessages);
    errorMessages = [];
  } else {
    success();
  }
}

export default {
  validate,
  addStrategy,
  addMessages,
};
