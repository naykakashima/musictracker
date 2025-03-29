import { Users, columns } from "./columns"
import { DataTable } from "./data-table"
import { StreamChart } from "./stream-chart"
import { UserDeletionForm } from "./user-deletion-form"


async function getData(): Promise<Users[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      username: "m@example.com",
    },
    // Add more sample data
    {
      id: "489e1d42",
      username: "user2@example.com",
    },
  ]
}

// Sample data for the chart
const chartData = [
  { day: "Monday", users: 120 },
  { day: "Tuesday", users: 200 },
  { day: "Wednesday", users: 150 },
  { day: "Thursday", users: 180 },
  { day: "Friday", users: 250 },
  { day: "Saturday", users: 300 },
  { day: "Sunday", users: 270 },
]

export default async function DemoPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">View Statistics</h2>
      
      {/* Chart Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Users by Day</h3>
        <StreamChart data={chartData} />
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Users</h3>
        <DataTable columns={columns} data={data} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">User Management</h3>
        <UserDeletionForm />
    </div>
    </div>

    
  )
}