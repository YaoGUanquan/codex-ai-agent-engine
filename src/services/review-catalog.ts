import { AGENT } from '../schemas/ae-asset-schema.js'

export type PredicateOperator = 'truthy' | 'eq' | 'oneOf' | 'contains'

export interface ActivationPredicate {
  field: string
  operator: PredicateOperator
  value?: unknown
}

export interface MatrixEntry {
  name: string
  domain: 'code' | 'document' | 'both'
  alwaysOn: boolean
  conditionGroups?: ActivationPredicate[][]
  description: string
}

export const REVIEW_MATRIX: MatrixEntry[] = [
  { name: AGENT.OCR_REVIEWER, domain: 'code', alwaysOn: true, description: 'OCR 代码审查主引擎，覆盖 bug、安全、性能、可维护性、测试、风格和配置。' },
  { name: AGENT.DOCUMENT_REVIEWER, domain: 'both', alwaysOn: true, description: '通用文档审查代理，审查文本一致性、可行性和证据。' },

  {
    name: AGENT.SECURITY_DESIGN_REVIEWER,
    domain: 'document',
    alwaysOn: false,
    conditionGroups: [[{ field: 'hasSecurity', operator: 'truthy' }]],
    description: '审查设计文档中的安全边界、认证授权和威胁模型。',
  },
  {
    name: AGENT.ARCHITECTURE_DESIGN_REVIEWER,
    domain: 'document',
    alwaysOn: false,
    conditionGroups: [
      [
        { field: 'hasDesignContract', operator: 'truthy' },
      ],
    ],
    description: '审查架构维度的边界、依赖方向和数据流。',
  },
  {
    name: AGENT.TEST_CASES_DESIGN_REVIEWER,
    domain: 'document',
    alwaysOn: false,
    conditionGroups: [[{ field: 'hasDesignContract', operator: 'truthy' }], [{ field: 'targetTypes', operator: 'contains', value: 'test-case' }]],
    description: '审查测试用例覆盖矩阵和维度覆盖追溯。',
  },
  {
    name: AGENT.GOAL_ALIGNMENT_REVIEWER,
    domain: 'both',
    alwaysOn: false,
    conditionGroups: [[{ field: 'hasGoalAlignment', operator: 'truthy' }]],
    description: '对照显式审查目标逐条校验变更是否达成各项目标，识别未达成项和偏离',
  },
  {
    name: AGENT.DESIGN_INTEGRITY_REVIEWER,
    domain: 'document',
    alwaysOn: false,
    conditionGroups: [
      [{ field: 'hasDesignContract', operator: 'truthy' }],
      [{ field: 'targetTypes', operator: 'contains', value: 'design' }],
    ],
    description: '审查跨维度设计完整性和一致性。',
  },
  {
    name: AGENT.TRACEABILITY_REVIEWER,
    domain: 'both',
    alwaysOn: false,
    conditionGroups: [
      [{ field: 'hasMixedTargets', operator: 'truthy' }],
      [{ field: 'kind', operator: 'eq', value: 'general' }],
    ],
    description: '审查需求/设计/测试用例之间的追溯一致性，识别孤儿条目、断裂引用和未声明的延期',
  },
]
