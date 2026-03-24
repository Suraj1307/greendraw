const CharityModel = {
  table: "charities",
  fields: {
    id: "uuid",
    slug: "text",
    name: "text",
    description: "text",
    category: "text",
    image_url: "text",
    upcoming_event: "text",
    featured: "boolean",
    created_at: "timestamp"
  }
};

export default CharityModel;
