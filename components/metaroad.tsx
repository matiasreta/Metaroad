"use client"

import { useState, useRef, useEffect, useCallback } from "react"
//import { createClient } from "@supabase/supabase-js";
import { supabase } from '../lib/supabase';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isEqual,isSameDay, isPast, isFuture } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ItemSchema {
  id: number
  text: string
  type: 'task' | 'milestone' | 'goal' | 'habit'
  date: string | null
  completed: boolean
  user_id: string
}

export function Metaroad() {
  
  const [items, setItems] = useState<ItemSchema[]>([])
  const [newItemText, setNewItemText] = useState("")
  const [newItemType, setNewItemType] = useState<'task' | 'milestone' | 'goal' | 'habit'>('task')
  //this is the hold timer for the items when you hold them
  const [holdItem, setHoldItem] = useState<number | null>(null)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimerRef = useRef<number | null>(null)
  //this is the calendar view
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const toggleCalendarView = () => setShowCalendar(!showCalendar)


  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const completedItems = items.filter(item => 
    item.completed && item.date && (
      isEqual(parse(item.date, 'yyyy-MM-dd', new Date()), selectedDate) ||
      (isToday(selectedDate) && isToday(parse(item.date, 'yyyy-MM-dd', new Date())))
    )
  )
  
  

  useEffect(() => {
    console.log("fetching items")
    async function fetchItems() {
      const { data, error } = await supabase
        .from('items')
        .select('*');
      
      if (error) {
        console.error('Error fetching items:', error);
      } else if (data) {
        
        setItems(data);
      }
    }
    fetchItems();
  }, []);

  //Manage items to the database
  const [animatingItemId, setAnimatingItemId] = useState<number | null>(null);

  const handleAddItem = async () => {
    if (newItemText.trim()) {
      let newItem: ItemSchema;

      try {
        if (newItemType === 'habit') {
          newItem = await addHabitItem();
        } else if (newItemType === 'goal') {
          newItem = await addGoalItem();
        } else if (newItemType === 'milestone') {
          newItem = await addMilestoneItem();
        } else if (newItemType === 'task') {
          newItem = await addTaskItem();
        } else {
          newItem = {
            user_id: "999",
            id: 999,
            text: newItemText,
            type: newItemType,
            date: format(selectedDate, 'yyyy-MM-dd'),
            completed: false
          };
        }

        setItems([...items, newItem]);
        setNewItemText("");
        setAnimatingItemId(newItem.id);
        
        // Remove the animating class after the animation is complete
        setTimeout(() => setAnimatingItemId(null), 500);
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  }

  const addHabitItem = async (): Promise<ItemSchema> => {
    const newItem={ 
      text: newItemText, 
      type: 'habit', 
      date: null,
      completed: false
    }

    const { data, error } = await supabase
      .from('items')
      .insert([newItem])
      .select()

    if (error) {
      throw new Error('Error adding habit item: ' + error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from database');
    }

    return data[0] as ItemSchema;
  }
  const addGoalItem=async()=>{
    const newItem={ 
      text: newItemText, 
      type: 'goal',
      date: format(selectedDate, 'yyyy-MM-dd'),
      completed: false
    }

    const { data, error } = await supabase
      .from('items')
      .insert([newItem])
      .select()

    if (error) {
      throw new Error('Error adding habit item: ' + error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from database');
    }

    return data[0] as ItemSchema;
  }
  const addMilestoneItem=async()=>{
    const newItem={ 
      text: newItemText, 
      type: 'milestone',
      date: format(selectedDate, 'yyyy-MM-dd'),
      completed: false
    }

    const { data, error } = await supabase
      .from('items')
      .insert([newItem])
      .select()

    if (error) {
      throw new Error('Error adding habit item: ' + error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from database');
    }

    return data[0] as ItemSchema;
  }
  const addTaskItem=async()=>{
    const newItem={ 
      text: newItemText, 
      type: 'task',
      date: selectedDate.toDateString() === new Date().toDateString() ? null : format(selectedDate, 'yyyy-MM-dd'),
      completed: false
    }

    const { data, error } = await supabase
      .from('items')
      .insert([newItem])
      .select()

    if (error) {
      throw new Error('Error adding habit item: ' + error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from database');
    }

    return data[0] as ItemSchema;
  }
  const achieveItem = async (id: number) => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const { error } = await supabase
      .from('items')
      .update({ completed: true, date: currentDate })
      .eq('id', id)
      .select()
    if (error) {
      throw new Error('Error updating item: ' + error.message);
    }
  }



  //////// this is the hold timer for the items when you hold them
  const handleItemHoldStart = (id: number) => {
    setHoldItem(id)
    setHoldProgress(0)
    holdTimerRef.current = window.setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdTimerRef.current!)
          handleItemComplete(id)
          return 0
        }
        return prev + (100 / 7) // Increase to 100% over 700ms (14.28% every 100ms)
      })
    }, 100)
  }
  const handleItemHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
    }
    setHoldItem(null)
    setHoldProgress(0)
  }
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current)
      }
    }
  }, [])
  const handleItemComplete = (id: number) => {
    achieveItem(id)
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: true } : item
    ))
  }
  const handleDeleteItem = async (id: number) => {
    //delete the item from the database
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .select()
    if (error) {
      throw new Error('Error deleting item: ' + error.message);
    }
    setItems(items.filter(item => item.id !== id))
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const filteredItems = items.filter(item => {
    return !item.completed && (!item.date || item.date === format(selectedDate, 'yyyy-MM-dd'))
  })

  const habits = filteredItems.filter(item => item.type === 'habit')
  const tasks = filteredItems.filter(item => item.type === 'task')
  const goals = filteredItems.filter(item => item.type === 'goal')
  const milestones = filteredItems.filter(item => item.type === 'milestone')


  const getItemColor = (type: 'task' | 'milestone' | 'goal' | 'habit') => {
    switch (type) {
      case 'task': return 'bg-[#F2F2F2] text-black'
      case 'milestone': return 'bg-[#053AC3] text-white'
      case 'goal': return 'bg-[#3B0198] text-white'
      case 'habit': return 'bg-[#FFD54F] text-black'
    }
  }

  const getHoverColor = (type: 'task' | 'milestone' | 'goal' | 'habit') => {
    switch (type) {
      case 'task': return 'bg-[#FFFFFF]'
      case 'milestone': return 'bg-[#2E5EFF]'
      case 'goal': return 'bg-[#6C20E0]'
      case 'habit': return 'bg-[#FFE17F]'
    }
  }

  const hasItemOnDate = (date: Date, type: 'task' | 'milestone' | 'goal' | 'habit') => {
    const dateString = format(date, 'yyyy-MM-dd')
    return items.some(item => item.type === type && item.date === dateString && !item.completed)
  }

  const hasCompletedItemOnDate = (date: Date, type: 'task' | 'milestone' | 'goal' | 'habit') => {
    const dateString = format(date, 'yyyy-MM-dd')
    const isCurrentDay = isSameDay(date, new Date());
    return items.some(item => item.type === type && item.date === dateString && item.completed) && !isCurrentDay;
  }


console.log(items)

//selected date view
  const DateView = ({ date }: { date: Date }) => (
    <div className="flex flex-col items-center bg-[#141212] text-white w-full h-full rounded-lg relative  ">
      <div className="text-7xl font-bold  pt-16" aria-label={`Selected date: ${format(date, 'MMMM d, yyyy')}`}>
        {format(date, "d")}
      </div>
      <div className="text-2xl font-bold">{format(date, "MMMM")}</div>
      <div className="text-xl mb-8 ">{format(date, "EEEE")}</div>
      <div className=" bottom-1 flex flex-wrap gap-1 max-w-[calc(8*1rem+4*0.25rem)] ">
        {completedItems.slice(0, 12).map((item) => (
          <div 
            key={item.id}
            className={`w-8 h-8 rounded ${getItemColor(item.type)}`}
            aria-label={`Completed ${item.type}`}
          />
        ))}
      </div>
    </div>
  )

  const renderItem = useCallback((item: ItemSchema) => (
    <div 
      key={item.id}
      className={`flex items-center pl-4 pr-2 rounded-xl ${getItemColor(item.type)} mb-1 relative overflow-hidden ${animatingItemId === item.id ? 'animate-fade-in' : ''}`}
    >
      <div
        className="flex-grow cursor-pointer text-sm flex items-center h-fit"
        onMouseDown={() => handleItemHoldStart(item.id)}
        onMouseUp={handleItemHoldEnd}
        onMouseLeave={handleItemHoldEnd}
        onTouchStart={() => handleItemHoldStart(item.id)}
        onTouchEnd={handleItemHoldEnd}
      >
        <div className="w-full overflow-hidden pt-3 pb-3 ">
          <p className="whitespace-normal break-words">{item.text}</p>
        </div>
        {holdItem === item.id && (
          <div 
            className={`absolute inset-0 ${getHoverColor(item.type)} opacity-50 transition-all duration-100 pointer-events-none`}
            style={{ clipPath: `inset(0 ${100 - holdProgress}% 0 0)` }}
          />
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDeleteItem(item.id)}
        className="ml-2 flex-shrink-0 hover:bg-transparent"
        aria-label={`Delete ${item.type}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ), [animatingItemId, getItemColor, handleItemHoldStart, handleItemHoldEnd, handleDeleteItem]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-4">
      
      <Card className="w-full bg-[#141212] text-white rounded-3xl border-[#141212]/20 ">
        <CardContent className="p-6">
          <div 
            className="w-full aspect-square rounded-lg overflow-hidden cursor-pointer" 
            onClick={toggleCalendarView}
            role="button"
            aria-expanded={showCalendar}
            aria-label={showCalendar ? "Show selected date" : "Show full calendar"}
          >
            {!showCalendar ? (
              <DateView date={selectedDate} />
            ) : (
              <div className="bg-[#141212] text-white p-4 w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }} aria-label="Previous month">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="font-semibold text-lg">
                    {format(currentMonth, "MMMM yyyy")}
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNextMonth(); }} aria-label="Next month">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="text-sm font-medium text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 flex-grow">
                  {monthDays.map((day) => (
                    <Button
                      key={day.toString()}
                      variant="ghost"
                      className={`
                        p-0 h-auto aspect-square flex flex-col items-center justify-center relative
                        ${isSameMonth(day, currentMonth) ? "text-white" : "text-gray-600"}
                        ${isToday(day) ? "bg-white text-black" : ""}
                        ${hasCompletedItemOnDate(day, 'habit') ? "bg-[#FFD54F] text-[#795405] font-bold " : ""}
                        hover:bg-white hover:text-black transition-colors
                      `}
                      onClick={(e) => { e.stopPropagation(); handleDateClick(day); }}
                    >
                      <span className="text-sm z-10">{format(day, "d")}</span>
                      <div className="absolute bottom-1 flex space-x-0.5 justify-center">
                        {hasItemOnDate(day, 'milestone') && (
                          <div className="w-1.5 h-1.5 bg-[#053AC3] rounded-sm" aria-label="Milestone on this date"></div>
                        )}
                        {hasItemOnDate(day, 'task') && (
                          <div className="w-1.5 h-1.5 bg-[#F2F2F2] rounded-sm" aria-label="Task on this date"></div>
                        )}
                        {hasItemOnDate(day, 'goal') && (
                          <div className="w-1.5 h-1.5 bg-[#3B0198] rounded-sm" aria-label="Goal on this date"></div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-2">
        <Select onValueChange={(value: 'task' | 'milestone' | 'goal' | 'habit') => setNewItemType(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="habit">Habit</SelectItem>
            <SelectItem value="milestone">Milestone</SelectItem>
            <SelectItem value="goal">Goal</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Add new item"  
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
          className="flex-grow"
        />
        <Button onClick={handleAddItem} className="bg-[#141212] shadow-sm shadow-[#000000]/30">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div >
        {habits.length > 0 && (
          <div>
            <h2 className="text-xs mb-1">Daily tasks</h2>
            {habits.map(renderItem)}
          </div>
        )}

        {tasks.length > 0 && (
          <div>
            {tasks.map(renderItem)}
          </div>
        )}

        {(goals.length > 0 || milestones.length > 0) && (
          <div>
            <h2 className="text-xs mb-1 mt-2">Goals and Milestones</h2>
            {milestones.map(renderItem)}
            {goals.map(renderItem)}
          </div>
        )}
      </div>
    </div>
  )
}