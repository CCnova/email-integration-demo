export default function handler(req, res) {
  console.log(req.query);
  res.redirect("https://www.google.com");
  res.status(200).json({ name: "John Doe" });
}
