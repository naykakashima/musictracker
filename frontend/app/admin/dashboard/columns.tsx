"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Users = {
  id: string
  username: string
}

export const columns: ColumnDef<Users>[] = [
  {
    accessorKey: "username",
    header: "Username",
  },
]
