"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { deleteUser } from "./deleteuser"

export function UserDeletionForm() {
  const [username, setUsername] = useState("")
  const [status, setStatus] = useState<{success: boolean, message: string} | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!username) {
      setStatus({ success: false, message: "Please enter a username" })
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteUser(username)
      setStatus(result)
      setUsername("")
    } catch (error) {
      setStatus({ success: false, message: "An error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
      <Input 
        type="text" 
        placeholder="Username" 
        className="flex-1"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Button 
        variant="destructive" 
        onClick={handleDelete}
        disabled={isLoading}
      >
        {isLoading ? "Deleting..." : "Delete User"}
      </Button>
      
      {status && (
        <p className={`text-sm ${status.success ? 'text-green-500' : 'text-red-500'}`}>
          {status.message}
        </p>
      )}
    </div>
  )
}