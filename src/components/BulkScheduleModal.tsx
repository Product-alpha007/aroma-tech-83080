import { useState } from "react";
import { Calendar, Clock, Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  workDuration: number;
  pauseDuration: number;
  weekDays: string[];
  enabled: boolean;
}

interface BulkScheduleModalProps {
  onApplySchedules?: (schedules: Schedule[]) => void;
}

export function BulkScheduleModal({ onApplySchedules }: BulkScheduleModalProps) {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      name: "Morning Shift",
      startTime: "08:00",
      endTime: "12:00",
      workDuration: 150,
      pauseDuration: 30,
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      enabled: true
    },
    {
      id: "2",
      name: "Afternoon Shift",
      startTime: "13:00",
      endTime: "17:00",
      workDuration: 120,
      pauseDuration: 40,
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      enabled: true
    }
  ]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    workDuration: 150,
    pauseDuration: 30,
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    enabled: true
  });
  const { toast } = useToast();

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleWeekDay = (day: string, isEditing: boolean = false) => {
    if (isEditing && editingSchedule) {
      setEditingSchedule({
        ...editingSchedule,
        weekDays: editingSchedule.weekDays.includes(day)
          ? editingSchedule.weekDays.filter(d => d !== day)
          : [...editingSchedule.weekDays, day]
      });
    } else {
      setNewSchedule(prev => ({
        ...prev,
        weekDays: prev.weekDays?.includes(day)
          ? prev.weekDays.filter(d => d !== day)
          : [...(prev.weekDays || []), day]
      }));
    }
  };

  const handleAddSchedule = () => {
    if (!newSchedule.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a schedule name",
        variant: "destructive"
      });
      return;
    }

    const schedule: Schedule = {
      id: Date.now().toString(),
      name: newSchedule.name,
      startTime: newSchedule.startTime || "08:00",
      endTime: newSchedule.endTime || "17:00",
      workDuration: newSchedule.workDuration || 150,
      pauseDuration: newSchedule.pauseDuration || 30,
      weekDays: newSchedule.weekDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      enabled: newSchedule.enabled ?? true
    };

    setSchedules(prev => [...prev, schedule]);
    setShowAddForm(false);
    setNewSchedule({
      name: "",
      startTime: "08:00",
      endTime: "17:00",
      workDuration: 150,
      pauseDuration: 30,
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      enabled: true
    });

    toast({
      title: "Schedule Added",
      description: `${schedule.name} has been created successfully`
    });
  };

  const handleUpdateSchedule = () => {
    if (!editingSchedule) return;

    setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? editingSchedule : s));
    setEditingSchedule(null);

    toast({
      title: "Schedule Updated",
      description: "Changes have been saved"
    });
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Schedule Deleted",
      description: "Schedule has been removed"
    });
  };

  const handleDuplicateSchedule = (schedule: Schedule) => {
    const duplicate: Schedule = {
      ...schedule,
      id: Date.now().toString(),
      name: `${schedule.name} (Copy)`
    };
    setSchedules(prev => [...prev, duplicate]);
    toast({
      title: "Schedule Duplicated",
      description: `Created a copy of ${schedule.name}`
    });
  };

  const toggleScheduleEnabled = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleApplyAll = () => {
    if (onApplySchedules) {
      onApplySchedules(schedules.filter(s => s.enabled));
    }
    setOpen(false);
    toast({
      title: "Schedules Applied",
      description: `${schedules.filter(s => s.enabled).length} schedule(s) applied to selected devices`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="w-4 h-4" />
          Bulk Schedules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Schedule Management</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Add Schedule Button */}
          {!showAddForm && !editingSchedule && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Add New Schedule
            </Button>
          )}

          {/* Add Schedule Form */}
          {showAddForm && (
            <Card className="p-4 bg-gradient-card border-border/50">
              <h3 className="font-semibold mb-4">New Schedule</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input
                    id="schedule-name"
                    placeholder="e.g., Morning Shift"
                    value={newSchedule.name || ""}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work-duration">Work Duration (sec)</Label>
                    <Input
                      id="work-duration"
                      type="number"
                      value={newSchedule.workDuration}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, workDuration: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pause-duration">Pause Duration (sec)</Label>
                    <Input
                      id="pause-duration"
                      type="number"
                      value={newSchedule.pauseDuration}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, pauseDuration: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Active Days</Label>
                  <div className="flex gap-2 mt-2">
                    {weekDays.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleWeekDay(day)}
                        className={cn(
                          "px-3 py-1 text-sm rounded transition-colors",
                          newSchedule.weekDays?.includes(day)
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-border hover:bg-accent"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddSchedule} className="flex-1">
                    Add Schedule
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSchedule({
                        name: "",
                        startTime: "08:00",
                        endTime: "17:00",
                        workDuration: 150,
                        pauseDuration: 30,
                        weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                        enabled: true
                      });
                    }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Edit Schedule Form */}
          {editingSchedule && (
            <Card className="p-4 bg-gradient-card border-primary/50">
              <h3 className="font-semibold mb-4">Edit Schedule</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-schedule-name">Schedule Name</Label>
                  <Input
                    id="edit-schedule-name"
                    value={editingSchedule.name}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-time">Start Time</Label>
                    <Input
                      id="edit-start-time"
                      type="time"
                      value={editingSchedule.startTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end-time">End Time</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={editingSchedule.endTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-work-duration">Work Duration (sec)</Label>
                    <Input
                      id="edit-work-duration"
                      type="number"
                      value={editingSchedule.workDuration}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, workDuration: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-pause-duration">Pause Duration (sec)</Label>
                    <Input
                      id="edit-pause-duration"
                      type="number"
                      value={editingSchedule.pauseDuration}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, pauseDuration: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Active Days</Label>
                  <div className="flex gap-2 mt-2">
                    {weekDays.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleWeekDay(day, true)}
                        className={cn(
                          "px-3 py-1 text-sm rounded transition-colors",
                          editingSchedule.weekDays.includes(day)
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-border hover:bg-accent"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateSchedule} className="flex-1">
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setEditingSchedule(null)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Schedules List */}
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <Card 
                key={schedule.id} 
                className={cn(
                  "p-4 bg-gradient-card border-border/50",
                  !schedule.enabled && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={schedule.enabled}
                      onCheckedChange={() => toggleScheduleEnabled(schedule.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{schedule.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        <div>
                          Work: {schedule.workDuration}s | Pause: {schedule.pauseDuration}s
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {schedule.weekDays.map(day => (
                          <Badge key={day} variant="secondary" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDuplicateSchedule(schedule)}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingSchedule(schedule)}
                      title="Edit"
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyAll}>
            Apply to Selected Devices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
