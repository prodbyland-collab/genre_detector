import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Disc3 className="size-6" />
          </div>
          <CardTitle>Welcome to Genredetect</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect Supabase auth to enable email and OAuth sign-in.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" disabled>
            Continue with Google
          </Button>
          <Button className="w-full" variant="outline" disabled>
            Continue with email
          </Button>
          <Button asChild className="w-full" variant="ghost">
            <Link href="/dashboard">Preview dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
