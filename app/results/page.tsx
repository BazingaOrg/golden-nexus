import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import ResultsList from "@/components/results-list"
import Link from "next/link"

export default function ResultsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">您的旅行计划</h1>
        <Link href="/">
          <Button variant="outline">新的旅行计划</Button>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-12">正在加载您的旅行计划...</div>}>
        <ResultsList searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
