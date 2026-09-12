import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function PasswordInput({ toggleName = 'senha', ...props }: Omit<ComponentProps<typeof Input>, 'type'> & { toggleName?: string }) {
  const [visible, setVisible] = useState(false)
  return <div className="relative">
    <Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
    <Button variant="ghost" size="icon" className="absolute top-0 right-0 text-primary" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${toggleName}`} aria-pressed={visible} disabled={props.disabled} onClick={() => setVisible(!visible)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>
  </div>
}
