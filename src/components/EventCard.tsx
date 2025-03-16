
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Users, Music } from "lucide-react";

export interface EventProps {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  teamSize: number;
  songCount: number;
  isUpcoming?: boolean;
}

const EventCard = ({ event }: { event: EventProps }) => {
  const formattedDate = format(new Date(event.date), "dd 'de' MMMM", {
    locale: ptBR,
  });
  
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg border-border/40 group">
      <div className="relative bg-primary/5 h-4 w-full">
        {event.isUpcoming && (
          <Badge 
            variant="default" 
            className="absolute -bottom-3 left-4 font-medium text-xs"
          >
            Próximo evento
          </Badge>
        )}
      </div>
      
      <CardHeader className="pt-7 pb-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-6 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm">
            <span className="font-medium block">{capitalizeFirstLetter(formattedDate)}</span>
            <div className="flex items-center mt-1 text-foreground/70">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{event.time}</span>
            </div>
          </div>
          
          <div className="text-sm text-foreground/70">
            <span>{event.location}</span>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <div className="flex items-center text-sm text-foreground/70">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <span>{event.teamSize} pessoas</span>
          </div>
          
          <div className="flex items-center text-sm text-foreground/70">
            <Music className="h-3.5 w-3.5 mr-1.5" />
            <span>{event.songCount} músicas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
