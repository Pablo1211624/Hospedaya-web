import { useEffect, useState } from 'react'
import { api } from './api'
export function useResource<T>(path: string) {
  const [version, setVersion] = useState(0)
  const key = path + ':' + version
  const [result, setResult] = useState<{ key: string; data: T | null; error: string }>({ key: '', data: null, error: '' })
  useEffect(() => {
    let active = true
    void api<T>(path).then(data => { if (active) setResult({ key, data, error: '' }) }).catch(e => { if (active) setResult({ key, data: null, error: e.message }) })
    return () => { active = false }
  }, [path, key])
  return { data: result.key === key ? result.data : null, error: result.key === key ? result.error : '', loading: result.key !== key, reload: () => setVersion(v => v + 1) }
}
