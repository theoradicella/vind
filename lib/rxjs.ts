import { BehaviorSubject, type Observable } from 'rxjs'

export function expose<T> (observable: Observable<T>) {
  const subject = new BehaviorSubject<T | null>(null)
  observable.subscribe(subject)
  return subject.getValue.bind(subject)
}

export function exposeSubject<T> (subject: BehaviorSubject<T>) {
  return subject.getValue.bind(subject)
}