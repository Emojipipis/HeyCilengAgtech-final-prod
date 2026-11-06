import { Modal } from '@/components/ui/Modal'
import { useAuthModal } from '@/hooks/useAuthModal'
import { ForgotPasswordFlow } from './ForgotPasswordFlow'
import { LoginForm } from './LoginForm'
import { SignupFlow } from './SignupFlow'

const titles = {
  login: 'Log in to HeyCileng',
  signup: 'Create your HeyCileng account',
  'forgot-password': 'Reset your password',
} as const

/** Renders the active auth modal over the current page, driven by the `?auth=` parameter. */
export function AuthModalHost() {
  const { view, closeAuth } = useAuthModal()

  return (
    <Modal open={view !== null} onClose={closeAuth} title={view ? titles[view] : undefined} hideTitle size={view === 'signup' ? 'lg' : 'md'}>
      {/* Keyed so each view starts fresh when switching between them. */}
      <div key={view} className="pt-4 pb-2 sm:px-2">
        {view === 'login' && <LoginForm />}
        {view === 'signup' && <SignupFlow />}
        {view === 'forgot-password' && <ForgotPasswordFlow />}
      </div>
    </Modal>
  )
}
