export default function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="alert alert-danger d-flex justify-content-between align-items-center gap-3"
      role="alert"
    >
      <span>{message}</span>
      <button type="button" className="btn btn-sm btn-outline-danger text-nowrap" onClick={onRetry}>
        Повторить
      </button>
    </div>
  )
}
