import { useId } from 'react'
import './Dropdown.css'

const options = [
  { value: 'TODAY', label: 'Today' },
  { value: '7D', label: 'This 7D' },
  { value: '30D', label: 'This 30D' },
  { value: 'THIS_MONTH', label: 'This month' },
]

export default function RangeDropdown({ title = 'Date range', value, onChange }) {
  const selectId = useId()

  return (
    <div className="range-dropdown">
      <label className="range-dropdown__title" htmlFor={selectId}>
        {title}
      </label>
      <select
        id={selectId}
        className="range-dropdown__select"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="" disabled>
          Select a range
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

