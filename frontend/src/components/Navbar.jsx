function Navbar() {
  return (
    <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-600">
        CardioShield AI
      </h1>

      <div className="flex items-center gap-4">
        <div className="text-gray-600 font-medium">Welcome</div>
        <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold">
          U
        </div>
      </div>
    </div>
  );
}

export default Navbar;