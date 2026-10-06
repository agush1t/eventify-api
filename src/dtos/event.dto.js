class EventDTO {
    constructor(event) {
        this.id = event._id?.toString() || event.id;
        this.title = event.title;
        this.description = event.description;
        this.category = event.category;
        this.date = event.date;
        this.location = event.location;
        this.capacity = event.capacity;
        this.price = event.price;
        this.status = event.status;
        this.organizer = event.organizer?._id?.toString()
            || event.organizer?.toString()
            || event.organizer;
    }
}

export default EventDTO;
