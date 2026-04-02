'use client'

export function LeadActions({ appointmentId }: { appointmentId: string }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => {
          fetch('/api/appointments/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId }),
          }).then(r => {
            alert(r.ok ? '✅ Convite enviado!' : '❌ Erro')
            if (r.ok) window.location.reload()
          })
        }}
        className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        + Novo Convite
      </button>
      <button
        onClick={() => {
          const s = prompt('1=Cadastrado, 0=Declinou')
          if (s === null) return
          const status = s === '1' ? 'registered' : 'declined'
          fetch('/api/appointments/finalize-contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId, status }),
          }).then(r => {
            alert(r.ok ? '✅ Finalizado!' : '❌ Erro')
            if (r.ok) window.location.reload()
          })
        }}
        className="px-3 py-1.5 text-xs font-medium bg-gray-500 hover:bg-gray-600 text-white rounded"
      >
        ✓ Finalizar
      </button>
    </div>
  )
}
