import BrandList from './components/BrandList'
import OffersTable from './components/OffersTable'
import SearchForm from './components/SearchForm'

export default function App() {
  return (
    <div className="container-xl py-4">
      <h1 className="h3 mb-3">Поиск автозапчастей и аналогов</h1>
      <div className="mb-4">
        <SearchForm />
      </div>
      <div className="row g-4">
        <aside className="col-lg-4 col-xl-3">
          <BrandList />
        </aside>
        <main className="col-lg-8 col-xl-9">
          <OffersTable />
        </main>
      </div>
    </div>
  )
}
