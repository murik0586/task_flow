import { formatDurationParts } from '../../utils/timeDuration';

const SLIDER_FIELDS = [
  { key: 'weeks', label: 'Недели', min: 0, max: 12 },
  { key: 'hours', label: 'Часы', min: 0, max: 168 },
  { key: 'minutes', label: 'Минуты', min: 0, max: 59 },
];

export const TimeDurationSliders = ({ label, value, onChange }) => {
  const handleChange = (field) => (event) => {
    onChange({
      ...value,
      [field]: Number(event.target.value),
    });
  };

  return (
    <div className="duration-sliders">
      {label && <span className="field-label">{label}</span>}
      {SLIDER_FIELDS.map((field) => (
        <div key={field.key} className="duration-slider-row">
          <div className="duration-slider-header">
            <label htmlFor={`${field.key}-slider`}>{field.label}</label>
            <span>{value[field.key] ?? 0}</span>
          </div>
          <input
            id={`${field.key}-slider`}
            type="range"
            min={field.min}
            max={field.max}
            value={value[field.key] ?? 0}
            onChange={handleChange(field.key)}
            className="duration-slider"
          />
        </div>
      ))}
      <p className="duration-summary">Итого: {formatDurationParts(value)}</p>
    </div>
  );
};
