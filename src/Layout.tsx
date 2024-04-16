export const Layout = ({ children }) => {
  return <div class="md:grid md:grid-cols-3 gap-3 flex flex-col">
    {children}
  </div>;
};