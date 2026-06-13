import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const enterprise = read('src/pages/EnterpriseApp.tsx');
const labs = read('src/pages/TakhetLabsPage.tsx');

assert(enterprise.includes('data-enterprise-roi-calculator'), 'Enterprise ROI calculator must remain on landing');
assert(enterprise.includes('const derivedMonthlyLoss = deriveMonthlyLoss(employees)'), 'Enterprise ROI must auto-derive hidden monthly loss from employee count');
assert(enterprise.includes('const derivedReduction = deriveReduction(employees)'), 'Enterprise ROI must auto-derive expected reduction from employee count');
assert(!enterprise.includes('setMonthlyLoss'), 'Enterprise ROI must not let user manually set hidden loss assumptions');
assert(!enterprise.includes('setReduction'), 'Enterprise ROI must not let user manually set hidden reduction assumptions');
assert(!enterprise.includes('Скрытая потеря на сотрудника в месяц'), 'Enterprise ROI must not expose hidden loss slider label');
assert(!enterprise.includes('Ожидаемое снижение потерь'), 'Enterprise ROI must not expose hidden reduction slider label');
assert(enterprise.includes('Только количество сотрудников'), 'Enterprise ROI must explain the single input');
assert(enterprise.includes('data-enterprise-footer'), 'Enterprise landing must have a Takhet-style final footer');
assert(enterprise.includes('Цифровое медицинское сопровождение предприятий'), 'Enterprise hero must use the requested title');

assert(labs.includes('data-labs-dynamic-graph'), 'Takhet Labs must include a dynamic graph section');
assert(labs.includes('const labsGraphSeries'), 'Takhet Labs graph must be data-driven');
assert(labs.includes('Проблема: анализы показывают цифры, но не динамику'), 'Takhet Labs must explain the user problem');
assert(labs.includes('Решение: Takhet Labs собирает данные в одну линию'), 'Takhet Labs must explain the solution');
assert(labs.includes('data-labs-footer'), 'Takhet Labs landing must have a Takhet-style final footer');
assert(!labs.includes('ROI calculator'), 'Takhet Labs must not use an ROI calculator pattern');

console.log('Enterprise and Labs final polish contract passed');
