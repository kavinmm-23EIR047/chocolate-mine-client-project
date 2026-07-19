function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8f8f8",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "3rem",
            color: "#6b3f1d",
            marginBottom: "20px",
          }}
        >
          🚧 Under Maintenance
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "#555",
            marginBottom: "10px",
          }}
        >
          We're making some improvements to serve you better.
        </p>

        <p
          style={{
            fontSize: "1rem",
            color: "#777",
          }}
        >
          The Chocolate Mine website will be back shortly.
        </p>
      </div>
    </div>
  );
}

export default App;
