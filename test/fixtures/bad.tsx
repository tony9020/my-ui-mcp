export function BadCard() {
  return (
    <div onClick={() => alert("hi")}>
      <img src="/hero.png" />
      <input placeholder="Email" />
      <div style={{ color: "#ff0055", background: "#fff" }}>
        <h3>Join 10,000 users</h3>
      </div>
      <button className="bg-red-500 !text-white">
        <span />
      </button>
    </div>
  );
}
