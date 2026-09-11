import { Tag } from 'antd'

type ScopeTagProps = {
  area?: 'CCI' | 'Postpaid'
  day?: 30 | 60
}

export function ScopeTag({ area = 'CCI', day = 30 }: ScopeTagProps) {
  return (
    <Tag className="scope-tag" color={area === 'CCI' ? 'blue' : 'cyan'}>
      {area} · Day {day}
    </Tag>
  )
}
