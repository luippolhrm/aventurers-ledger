import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
            </div>
            <CardDescription>We've sent you a confirmation email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please check your email and click the confirmation link to activate your account.
              </p>
              <p className="text-sm text-muted-foreground">
                After confirming, you can{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  login here
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
