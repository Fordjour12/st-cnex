import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { JSX, SVGProps } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { clientSignIn } from '@/lib/auth-client'
import { getSessionWithRole } from '@/lib/server/auth'

const GitHubIcon = (
   props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>,
) => (
   <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
   </svg>
)

const GoogleIcon = (
   props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>,
) => (
   <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
   </svg>
)



type LoginFormValues = {
   email: string
   password: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toFieldErrors(
   errors: Array<unknown> | undefined,
): Array<{ message?: string }> {
   if (!errors?.length) {
      return []
   }

   return errors
      .map((error) => {
         if (typeof error === 'string') {
            return { message: error }
         }

         if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
         ) {
            return { message: error.message }
         }

         return { message: 'Invalid value' }
      })
      .filter((error) => Boolean(error.message))
}

function getSignInErrorMessage(error: unknown): string {
   if (typeof error === 'string' && error.length > 0) {
      return error
   }

   if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
   ) {
      return error.message
   }

   return 'Unable to sign in. Please try again.'
}

export default function Login() {
   const [submitError, setSubmitError] = useState<string | null>(null)
   const navigate = useNavigate()

   const form = useForm({
      defaultValues: {
         email: '',
         password: '',
      } satisfies LoginFormValues,
      onSubmit: async ({ value }) => {
         setSubmitError(null)

         try {
            const result = await clientSignIn(value)
            if (result.error) {
               setSubmitError(getSignInErrorMessage(result.error))
               return
            }

            const sessionData = await getSessionWithRole()
            if (sessionData.session && sessionData.isAdmin) {
               navigate({ to: '/admin' })
            } else {
               navigate({ to: '/' })
            }
         } catch (error: unknown) {
            setSubmitError(getSignInErrorMessage(error))
         }
      },
   })

   return (
      <div className="flex min-h-dvh items-center justify-center">
         <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">

               <h3 className="text-balance mt-6 text-lg font-semibold text-foreground dark:text-foreground">
                  Sign in to your account
               </h3>
               <p className="text-pretty mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  Don&apos;t have an account?{' '}

                  <Button variant="link" nativeButton={false} render={
                     <Link
                        to="/auth/create-account"
                        className="font-medium"
                     >
                        Create Account
                     </Link>
                  } />

               </p>
               <div className="mt-8 flex flex-col items-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Button
                     variant="outline"
                     className="flex-1 items-center justify-center space-x-2 py-2"
                     render={<a href="#" />}
                     nativeButton={false}
                  >
                     <GitHubIcon className="size-5" aria-hidden={true} />
                     <span className="text-sm font-medium">Login with GitHub</span>
                  </Button>
                  <Button
                     variant="outline"
                     className="mt-2 flex-1 items-center justify-center space-x-2 py-2 sm:mt-0"
                     render={<a href="#" />}
                     nativeButton={false}
                  >
                     <GoogleIcon className="size-4" aria-hidden={true} />
                     <span className="text-sm font-medium">Login with Google</span>
                  </Button>
               </div>

               <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                     <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-background px-2 text-muted-foreground">
                        or
                     </span>
                  </div>
               </div>

               <form
                  className="mt-6 space-y-4"
                  noValidate
                  onSubmit={(event) => {
                     event.preventDefault()
                     event.stopPropagation()
                     void form.handleSubmit()
                  }}
               >
                  <form.Field
                     name="email"
                     validators={{
                        onChange: ({ value }) => {
                           if (!value) {
                              return 'Email is required'
                           }

                           if (!EMAIL_PATTERN.test(value)) {
                              return 'Enter a valid email address'
                           }
                        },
                     }}
                  >
                     {(field) => (
                        <Field
                           data-invalid={
                              field.state.meta.isTouched
                                 ? !field.state.meta.isValid
                                 : undefined
                           }
                        >
                           <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              type="email"
                              value={field.state.value}
                              autoComplete="email"
                              placeholder="ephraim@blocks.so"
                              className="mt-2 py-4"
                              aria-invalid={
                                 field.state.meta.isTouched
                                    ? !field.state.meta.isValid
                                    : undefined
                              }
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                           />
                           <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                        </Field>
                     )}
                  </form.Field>

                  <form.Field
                     name="password"
                     validators={{
                        onChange: ({ value }) => {
                           if (!value) {
                              return 'Password is required'
                           }

                           if (value.length < 8) {
                              return 'Password must be at least 8 characters'
                           }
                        },
                     }}
                  >
                     {(field) => (
                        <Field
                           data-invalid={
                              field.state.meta.isTouched
                                 ? !field.state.meta.isValid
                                 : undefined
                           }
                        >
                           <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              type="password"
                              value={field.state.value}
                              autoComplete="current-password"
                              placeholder="********"
                              className="mt-2 py-4"
                              aria-invalid={
                                 field.state.meta.isTouched
                                    ? !field.state.meta.isValid
                                    : undefined
                              }
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                           />
                           <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                        </Field>
                     )}
                  </form.Field>

                  {submitError && (
                     <p className="text-sm text-destructive">{submitError}</p>
                  )}

                  <form.Subscribe
                     selector={(state) => [state.canSubmit, state.isSubmitting]}
                     children={([canSubmit, isSubmitting]) => (
                        <Button
                           type="submit"
                           disabled={!canSubmit}
                           className="mt-4 w-full py-4 font-medium"
                        >
                           {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                     )}
                  />
               </form>
               <p className="text-pretty mt-6 text-sm text-muted-foreground dark:text-muted-foreground">
                  Forgot your password?{' '}
                  <Button variant="link" nativeButton={false}
                     render={
                        <Link
                           to="/auth/reset-password"
                           className='font-medium'
                        >
                           Reset password
                        </Link>
                     } />

               </p>
            </div>
         </div>
      </div >
   )
}
